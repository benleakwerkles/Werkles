#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_RELEASE_CONTRACT = "deploy/production-release-contract.json";
export const DEFAULT_APP_PATHS_MANIFEST = ".next/server/app-paths-manifest.json";

export function evaluateProductionReleaseIntegrity(input = {}) {
  const contractResult = validateContract(input.contract);
  if (!contractResult.ok) {
    return resultFromReasons(
      [{ code: "INVALID_RELEASE_CONTRACT", detail: contractResult.detail }],
      emptyChecks(),
      emptyEvidence(input)
    );
  }

  const contract = contractResult.contract;
  const reasons = [];
  const checks = emptyChecks();
  const headSha = normalizeSha(input.headSha);
  const approvedSha = normalizeSha(input.approvedSha);
  const approvedDeploymentId = normalizeDeploymentId(input.approvedDeploymentId);
  const productionDeploymentId = normalizeDeploymentId(input.productionDeploymentId);

  if (typeof input.dirty !== "boolean") {
    reasons.push({ code: "DIRTY_STATE_REQUIRED", detail: "dirty must be an explicit boolean." });
  } else if (input.dirty) {
    reasons.push({ code: "DIRTY_WORKTREE", detail: "Release worktree contains tracked or untracked changes." });
  } else {
    checks.worktree_clean = true;
  }

  if (!headSha) {
    reasons.push({ code: "HEAD_SHA_REQUIRED", detail: "Current HEAD SHA is required." });
  }
  if (!approvedSha) {
    reasons.push({ code: "APPROVED_SHA_REQUIRED", detail: "Approved release SHA is required." });
  }
  if (headSha && approvedSha) {
    if (headSha !== approvedSha) {
      reasons.push({
        code: "HEAD_SHA_MISMATCH",
        detail: `HEAD ${headSha} does not equal approved SHA ${approvedSha}.`
      });
    } else {
      checks.head_matches_approved_sha = true;
    }
  }

  if (!approvedDeploymentId) {
    reasons.push({
      code: "APPROVED_DEPLOYMENT_ID_REQUIRED",
      detail: "The exact approved Vercel deployment ID is required."
    });
  }
  if (!productionDeploymentId) {
    reasons.push({
      code: "PRODUCTION_DEPLOYMENT_ID_REQUIRED",
      detail: "The exact current Production deployment ID is required for audience-boundary proof."
    });
  }

  const appPathKeys = manifestKeys(input.appPathsManifest);
  let missingAppPaths = [...contract.required_app_paths];
  if (!appPathKeys) {
    reasons.push({
      code: "APP_PATHS_MANIFEST_REQUIRED",
      detail: "A parsed Next.js app-paths manifest object is required."
    });
  } else {
    const present = new Set(appPathKeys);
    missingAppPaths = contract.required_app_paths.filter((route) => !present.has(route));
    if (missingAppPaths.length) {
      reasons.push({
        code: "MISSING_APP_PATH",
        detail: missingAppPaths.join(", ")
      });
    } else {
      checks.app_paths_complete = true;
    }
  }

  const candidate = isPlainObject(input.candidate) ? input.candidate : null;
  const candidateDeploymentId = deploymentIdFromObject(candidate);
  let candidateRoutes = [];
  let missingCandidateRoutes = [...contract.required_candidate_output_routes];
  if (!candidate) {
    reasons.push({
      code: "CANDIDATE_REQUIRED",
      detail: "A parsed Vercel candidate inspection object is required."
    });
  } else {
    if (!candidateDeploymentId) {
      reasons.push({
        code: "CANDIDATE_DEPLOYMENT_ID_REQUIRED",
        detail: "Candidate deployment id or uid is required."
      });
    } else if (approvedDeploymentId && candidateDeploymentId !== approvedDeploymentId) {
      reasons.push({
        code: "CANDIDATE_DEPLOYMENT_ID_MISMATCH",
        detail: `Candidate deployment ${candidateDeploymentId} does not equal approved deployment ${approvedDeploymentId}.`
      });
    } else if (approvedDeploymentId) {
      checks.candidate_deployment_id_matches = true;
    }

    if (candidate.name !== contract.candidate.name) {
      reasons.push({
        code: "CANDIDATE_NAME_MISMATCH",
        detail: `Candidate name ${display(candidate.name)} does not equal ${contract.candidate.name}.`
      });
    } else {
      checks.candidate_name_matches = true;
    }

    if (candidate.target !== contract.candidate.target) {
      reasons.push({
        code: "CANDIDATE_TARGET_MISMATCH",
        detail: `Candidate target ${display(candidate.target)} does not equal ${contract.candidate.target}.`
      });
    } else {
      checks.candidate_target_matches = true;
    }

    if (candidate.readyState !== contract.candidate.ready_state) {
      reasons.push({
        code: "CANDIDATE_NOT_READY",
        detail: `Candidate readyState ${display(candidate.readyState)} does not equal ${contract.candidate.ready_state}.`
      });
    } else {
      checks.candidate_ready = true;
    }

    candidateRoutes = collectCandidateRoutes(candidate);
    const present = new Set(candidateRoutes);
    missingCandidateRoutes = contract.required_candidate_output_routes.filter((route) => !present.has(route));
    if (missingCandidateRoutes.length) {
      reasons.push({
        code: "MISSING_CANDIDATE_OUTPUT_ROUTE",
        detail: missingCandidateRoutes.join(", ")
      });
    } else {
      checks.candidate_routes_complete = true;
    }
  }

  const provenance = isPlainObject(input.provenance) ? input.provenance : null;
  const provenanceDeploymentId = deploymentIdFromObject(provenance);
  const sourceSha = normalizeSha(provenance?.gitSource?.sha);
  const sourceType = normalizeText(provenance?.gitSource?.type);
  const sourceRepoId = normalizeText(provenance?.gitSource?.repoId);
  const sourceOrg = normalizeText(provenance?.meta?.githubCommitOrg ?? provenance?.meta?.githubOrg);
  const sourceRepo = normalizeText(provenance?.meta?.githubCommitRepo ?? provenance?.meta?.githubRepo);

  if (!provenance) {
    reasons.push({
      code: "PROVENANCE_REQUIRED",
      detail: "A separate parsed Vercel provenance object is required."
    });
  } else {
    if (!provenanceDeploymentId) {
      reasons.push({
        code: "PROVENANCE_DEPLOYMENT_ID_REQUIRED",
        detail: "Provenance deployment id or uid is required."
      });
    } else if (candidateDeploymentId && provenanceDeploymentId !== candidateDeploymentId) {
      reasons.push({
        code: "PROVENANCE_DEPLOYMENT_ID_MISMATCH",
        detail: `Provenance deployment ${provenanceDeploymentId} does not equal candidate deployment ${candidateDeploymentId}.`
      });
    } else if (candidateDeploymentId) {
      checks.provenance_deployment_matches_candidate = true;
    }

    if (!sourceSha) {
      reasons.push({
        code: "PROVENANCE_SHA_REQUIRED",
        detail: "Provenance gitSource.sha is required."
      });
    } else if (approvedSha && sourceSha !== approvedSha) {
      reasons.push({
        code: "PROVENANCE_SHA_MISMATCH",
        detail: `Provenance source SHA ${sourceSha} does not equal approved SHA ${approvedSha}.`
      });
    } else if (approvedSha) {
      checks.provenance_sha_matches_approved = true;
    }

    const expectedSource = contract.provenance_source;
    const sourceMatches =
      sourceType.toLowerCase() === expectedSource.type.toLowerCase() &&
      Boolean(sourceRepoId) &&
      sourceOrg.toLowerCase() === expectedSource.github_org.toLowerCase() &&
      sourceRepo.toLowerCase() === expectedSource.github_repo.toLowerCase();
    if (!sourceMatches) {
      reasons.push({
        code: "PROVENANCE_SOURCE_MISMATCH",
        detail: `Provenance source must be ${expectedSource.type}:${expectedSource.github_org}/${expectedSource.github_repo} with a GitHub repo ID.`
      });
    } else {
      checks.provenance_source_matches = true;
    }
  }

  const candidateHttpBoundaries = isPlainObject(input.candidateHttpBoundaries)
    ? input.candidateHttpBoundaries
    : null;
  const candidateHttpDeploymentId = normalizeDeploymentId(candidateHttpBoundaries?.deployment_id);
  const boundaryResponses = Array.isArray(candidateHttpBoundaries?.responses)
    ? candidateHttpBoundaries.responses
    : [];
  let missingCandidateHttpBoundaries = contract.required_candidate_http_boundaries.map(httpBoundaryKey);
  const failedCandidateHttpBoundaries = [];

  if (!candidateHttpBoundaries) {
    reasons.push({
      code: "CANDIDATE_HTTP_BOUNDARIES_REQUIRED",
      detail: "Parsed exact-candidate HTTP boundary evidence is required."
    });
  } else {
    let httpDeploymentMatches = false;
    if (!candidateHttpDeploymentId) {
      reasons.push({
        code: "CANDIDATE_HTTP_DEPLOYMENT_ID_REQUIRED",
        detail: "HTTP boundary evidence deployment_id is required."
      });
    } else if (candidateDeploymentId && candidateHttpDeploymentId !== candidateDeploymentId) {
      reasons.push({
        code: "CANDIDATE_HTTP_DEPLOYMENT_ID_MISMATCH",
        detail: `HTTP boundary deployment ${candidateHttpDeploymentId} does not equal candidate deployment ${candidateDeploymentId}.`
      });
    } else if (candidateDeploymentId) {
      httpDeploymentMatches = true;
    }

    if (!Array.isArray(candidateHttpBoundaries.responses)) {
      reasons.push({
        code: "CANDIDATE_HTTP_RESPONSES_REQUIRED",
        detail: "HTTP boundary evidence responses must be an array."
      });
    } else {
      const responseIndex = indexHttpBoundaryResponses(boundaryResponses);
      missingCandidateHttpBoundaries = [];

      for (const expected of contract.required_candidate_http_boundaries) {
        const key = httpBoundaryKey(expected);
        const matches = responseIndex.get(key) ?? [];
        if (!matches.length) {
          missingCandidateHttpBoundaries.push(key);
          reasons.push({
            code: "MISSING_CANDIDATE_HTTP_BOUNDARY",
            detail: key
          });
          continue;
        }
        if (matches.length !== 1) {
          failedCandidateHttpBoundaries.push(`${key}:duplicate`);
          reasons.push({
            code: "DUPLICATE_CANDIDATE_HTTP_BOUNDARY",
            detail: key
          });
          continue;
        }

        const actual = matches[0];
        if (actual.status !== expected.status) {
          failedCandidateHttpBoundaries.push(`${key}:status`);
          reasons.push({
            code: "CANDIDATE_HTTP_STATUS_MISMATCH",
            detail: `${key} expected ${expected.status}, got ${display(actual.status)}.`
          });
        }

        const headerMismatches = expectedHeaderMismatches(expected.headers, actual.headers);
        for (const header of headerMismatches) {
          failedCandidateHttpBoundaries.push(`${key}:header:${header}`);
          reasons.push({
            code: "CANDIDATE_HTTP_HEADER_MISMATCH",
            detail: `${key} did not satisfy required header ${header}.`
          });
        }

        const jsonMismatches = expectedJsonMismatches(expected.json, actual.json);
        for (const field of jsonMismatches) {
          failedCandidateHttpBoundaries.push(`${key}:json:${field}`);
          reasons.push({
            code: "CANDIDATE_HTTP_JSON_MISMATCH",
            detail: `${key} did not satisfy required JSON field ${field}.`
          });
        }
      }

      if (
        httpDeploymentMatches &&
        !missingCandidateHttpBoundaries.length &&
        !failedCandidateHttpBoundaries.length
      ) {
        checks.candidate_http_boundaries_complete = true;
      }
    }
  }

  const audienceHttpBoundaries = isPlainObject(input.audienceHttpBoundaries)
    ? input.audienceHttpBoundaries
    : null;
  const audienceCandidateDeploymentId = normalizeDeploymentId(
    audienceHttpBoundaries?.candidate_deployment_id
  );
  const audienceProductionDeploymentId = normalizeDeploymentId(
    audienceHttpBoundaries?.production_deployment_id
  );
  const audienceResponses = Array.isArray(audienceHttpBoundaries?.responses)
    ? audienceHttpBoundaries.responses
    : [];
  let missingAudienceHttpBoundaries = contract.required_audience_http_boundaries.map(audienceBoundaryKey);
  const failedAudienceHttpBoundaries = [];

  if (!audienceHttpBoundaries) {
    reasons.push({
      code: "AUDIENCE_HTTP_BOUNDARIES_REQUIRED",
      detail: "Parsed protected-Preview and Production audience-boundary evidence is required."
    });
  } else {
    let audienceDeploymentsMatch = true;
    if (!audienceCandidateDeploymentId) {
      audienceDeploymentsMatch = false;
      reasons.push({
        code: "AUDIENCE_CANDIDATE_DEPLOYMENT_ID_REQUIRED",
        detail: "Audience evidence candidate_deployment_id is required."
      });
    } else if (candidateDeploymentId && audienceCandidateDeploymentId !== candidateDeploymentId) {
      audienceDeploymentsMatch = false;
      reasons.push({
        code: "AUDIENCE_CANDIDATE_DEPLOYMENT_ID_MISMATCH",
        detail: `Audience candidate deployment ${audienceCandidateDeploymentId} does not equal candidate deployment ${candidateDeploymentId}.`
      });
    }

    if (!audienceProductionDeploymentId) {
      audienceDeploymentsMatch = false;
      reasons.push({
        code: "AUDIENCE_PRODUCTION_DEPLOYMENT_ID_REQUIRED",
        detail: "Audience evidence production_deployment_id is required."
      });
    } else if (productionDeploymentId && audienceProductionDeploymentId !== productionDeploymentId) {
      audienceDeploymentsMatch = false;
      reasons.push({
        code: "AUDIENCE_PRODUCTION_DEPLOYMENT_ID_MISMATCH",
        detail: `Audience Production deployment ${audienceProductionDeploymentId} does not equal approved current Production deployment ${productionDeploymentId}.`
      });
    }

    if (audienceDeploymentsMatch && candidateDeploymentId && productionDeploymentId) {
      checks.audience_boundary_deployments_match = true;
    }

    if (!Array.isArray(audienceHttpBoundaries.responses)) {
      reasons.push({
        code: "AUDIENCE_HTTP_RESPONSES_REQUIRED",
        detail: "Audience-boundary evidence responses must be an array."
      });
    } else {
      const responseIndex = indexAudienceBoundaryResponses(audienceResponses);
      missingAudienceHttpBoundaries = [];

      for (const expected of contract.required_audience_http_boundaries) {
        const key = audienceBoundaryKey(expected);
        const matches = responseIndex.get(key) ?? [];
        if (!matches.length) {
          missingAudienceHttpBoundaries.push(key);
          reasons.push({
            code: "MISSING_AUDIENCE_HTTP_BOUNDARY",
            detail: key
          });
          continue;
        }
        if (matches.length !== 1) {
          failedAudienceHttpBoundaries.push(`${key}:duplicate`);
          reasons.push({
            code: "DUPLICATE_AUDIENCE_HTTP_BOUNDARY",
            detail: key
          });
          continue;
        }

        const actual = matches[0];
        if (actual.status !== expected.status) {
          failedAudienceHttpBoundaries.push(`${key}:status`);
          reasons.push({
            code: "AUDIENCE_HTTP_STATUS_MISMATCH",
            detail: `${key} expected ${expected.status}, got ${display(actual.status)}.`
          });
        }

        for (const header of expectedHeaderMismatches(expected.headers, actual.headers)) {
          failedAudienceHttpBoundaries.push(`${key}:header:${header}`);
          reasons.push({
            code: "AUDIENCE_HTTP_HEADER_MISMATCH",
            detail: `${key} did not satisfy required header ${header}.`
          });
        }

        for (const header of expectedHeaderPrefixMismatches(expected.header_prefixes, actual.headers)) {
          failedAudienceHttpBoundaries.push(`${key}:header-prefix:${header}`);
          reasons.push({
            code: "AUDIENCE_HTTP_HEADER_PREFIX_MISMATCH",
            detail: `${key} did not satisfy required header prefix ${header}.`
          });
        }
      }

      if (
        checks.audience_boundary_deployments_match &&
        !missingAudienceHttpBoundaries.length &&
        !failedAudienceHttpBoundaries.length
      ) {
        checks.audience_http_boundaries_complete = true;
      }
    }
  }

  return resultFromReasons(reasons, checks, {
    head_sha: headSha || null,
    approved_sha: approvedSha || null,
    approved_deployment_id: approvedDeploymentId || null,
    production_deployment_id: productionDeploymentId || null,
    dirty: typeof input.dirty === "boolean" ? input.dirty : null,
    candidate_deployment_id: candidateDeploymentId || null,
    candidate_name: candidate?.name ?? null,
    candidate_target: candidate?.target ?? null,
    candidate_ready_state: candidate?.readyState ?? null,
    provenance_deployment_id: provenanceDeploymentId || null,
    source_sha: sourceSha || null,
    source_type: sourceType || null,
    source_repo_id: sourceRepoId || null,
    source_github_org: sourceOrg || null,
    source_github_repo: sourceRepo || null,
    candidate_http_deployment_id: candidateHttpDeploymentId || null,
    candidate_http_boundary_count: boundaryResponses.length,
    audience_candidate_deployment_id: audienceCandidateDeploymentId || null,
    audience_production_deployment_id: audienceProductionDeploymentId || null,
    audience_http_boundary_count: audienceResponses.length,
    app_path_count: appPathKeys?.length ?? 0,
    candidate_route_count: candidateRoutes.length,
    missing_app_paths: missingAppPaths,
    missing_candidate_routes: missingCandidateRoutes,
    missing_candidate_http_boundaries: missingCandidateHttpBoundaries,
    failed_candidate_http_boundaries: failedCandidateHttpBoundaries,
    missing_audience_http_boundaries: missingAudienceHttpBoundaries,
    failed_audience_http_boundaries: failedAudienceHttpBoundaries
  });
}

export function collectCandidateRoutes(candidate) {
  if (!isPlainObject(candidate)) return [];

  const entries = [];
  if (Array.isArray(candidate.output)) entries.push(...candidate.output);
  if (Array.isArray(candidate.outputs)) entries.push(...candidate.outputs);
  if (Array.isArray(candidate.builds)) {
    for (const build of candidate.builds) {
      if (Array.isArray(build?.output)) entries.push(...build.output);
    }
  }

  return [...new Set(entries.map(routeFromOutputEntry).filter(Boolean))].sort();
}

function routeFromOutputEntry(entry) {
  const value = typeof entry === "string" ? entry : entry?.path;
  return String(value ?? "")
    .trim()
    .replace(/^\/+|\/+$/g, "");
}

function manifestKeys(manifest) {
  if (!isPlainObject(manifest)) return null;
  return Object.keys(manifest);
}

function httpBoundaryKey(boundary) {
  const method = normalizeText(boundary?.method).toUpperCase();
  const route = normalizeHttpPath(boundary?.path);
  return `${method} ${route}`.trim();
}

function audienceBoundaryKey(boundary) {
  const audience = normalizeText(boundary?.audience).toLowerCase();
  return `${audience} ${httpBoundaryKey(boundary)}`.trim();
}

function normalizeHttpPath(value) {
  const route = normalizeText(value);
  if (!route) return "";
  return `/${route.replace(/^\/+|\/+$/g, "")}`;
}

function indexHttpBoundaryResponses(responses) {
  const index = new Map();
  for (const response of responses) {
    if (!isPlainObject(response)) continue;
    const key = httpBoundaryKey(response);
    const entries = index.get(key) ?? [];
    entries.push(response);
    index.set(key, entries);
  }
  return index;
}

function indexAudienceBoundaryResponses(responses) {
  const index = new Map();
  for (const response of responses) {
    if (!isPlainObject(response)) continue;
    const key = audienceBoundaryKey(response);
    const entries = index.get(key) ?? [];
    entries.push(response);
    index.set(key, entries);
  }
  return index;
}

function expectedHeaderMismatches(expectedHeaders, actualHeaders) {
  if (!isPlainObject(expectedHeaders)) return [];
  const actual = new Map(
    Object.entries(isPlainObject(actualHeaders) ? actualHeaders : {}).map(([name, value]) => [
      name.toLowerCase(),
      normalizeText(value).toLowerCase()
    ])
  );

  return Object.entries(expectedHeaders)
    .filter(([name, expectedValue]) => {
      const expectedTokens = normalizeText(expectedValue)
        .toLowerCase()
        .split(",")
        .map((token) => token.trim())
        .filter(Boolean);
      const actualTokens = (actual.get(name.toLowerCase()) ?? "")
        .split(",")
        .map((token) => token.trim())
        .filter(Boolean);
      return !expectedTokens.every((token) => actualTokens.includes(token));
    })
    .map(([name]) => name.toLowerCase());
}

function expectedHeaderPrefixMismatches(expectedPrefixes, actualHeaders) {
  if (!isPlainObject(expectedPrefixes)) return [];
  const actual = new Map(
    Object.entries(isPlainObject(actualHeaders) ? actualHeaders : {}).map(([name, value]) => [
      name.toLowerCase(),
      normalizeText(value).toLowerCase()
    ])
  );

  return Object.entries(expectedPrefixes)
    .filter(([name, expectedPrefix]) => {
      const value = actual.get(name.toLowerCase()) ?? "";
      return !value.startsWith(normalizeText(expectedPrefix).toLowerCase());
    })
    .map(([name]) => name.toLowerCase());
}

function expectedJsonMismatches(expected, actual, prefix = "json") {
  if (expected === undefined) return [];
  if (!isPlainObject(expected)) {
    return Object.is(expected, actual) ? [] : [prefix];
  }
  if (!isPlainObject(actual)) return [prefix];

  const mismatches = [];
  for (const [key, expectedValue] of Object.entries(expected)) {
    mismatches.push(...expectedJsonMismatches(expectedValue, actual[key], `${prefix}.${key}`));
  }
  return mismatches;
}

function validHttpBoundaryContract(boundary) {
  if (!isPlainObject(boundary)) return false;
  if (!nonEmptyString(boundary.method) || !normalizeHttpPath(boundary.path)) return false;
  if (!Number.isInteger(boundary.status) || boundary.status < 100 || boundary.status > 599) return false;
  if (
    boundary.headers !== undefined &&
    (!isPlainObject(boundary.headers) || !Object.values(boundary.headers).every(nonEmptyString))
  ) {
    return false;
  }
  if (
    boundary.header_prefixes !== undefined &&
    (!isPlainObject(boundary.header_prefixes) ||
      !Object.values(boundary.header_prefixes).every(nonEmptyString))
  ) {
    return false;
  }
  return boundary.json === undefined || validExpectedJson(boundary.json);
}

function validExpectedJson(value) {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return true;
  return isPlainObject(value) && Object.values(value).every(validExpectedJson);
}

function validateContract(contract) {
  if (!isPlainObject(contract)) return { ok: false, detail: "Contract must be a JSON object." };
  if (contract.schema !== "werkles.production-release-contract/v1") {
    return { ok: false, detail: "Unsupported or missing contract schema." };
  }
  if (!isPlainObject(contract.candidate)) {
    return { ok: false, detail: "Contract candidate must be an object." };
  }
  if (!isPlainObject(contract.provenance_source)) {
    return { ok: false, detail: "Contract provenance_source must be an object." };
  }
  for (const field of ["type", "github_org", "github_repo"]) {
    if (!nonEmptyString(contract.provenance_source[field])) {
      return { ok: false, detail: `Contract provenance_source.${field} must be a non-empty string.` };
    }
  }
  for (const field of ["name", "target", "ready_state"]) {
    if (!nonEmptyString(contract.candidate[field])) {
      return { ok: false, detail: `Contract candidate.${field} must be a non-empty string.` };
    }
  }
  for (const field of ["required_app_paths", "required_candidate_output_routes"]) {
    if (!Array.isArray(contract[field]) || !contract[field].length || !contract[field].every(nonEmptyString)) {
      return { ok: false, detail: `Contract ${field} must be a non-empty string array.` };
    }
  }
  if (
    !Array.isArray(contract.required_candidate_http_boundaries) ||
    !contract.required_candidate_http_boundaries.length
  ) {
    return {
      ok: false,
      detail: "Contract required_candidate_http_boundaries must be a non-empty array."
    };
  }
  const boundaryKeys = new Set();
  for (const boundary of contract.required_candidate_http_boundaries) {
    if (!validHttpBoundaryContract(boundary)) {
      return {
        ok: false,
        detail: "Each required_candidate_http_boundaries entry must define method, path, status, and valid optional headers/json objects."
      };
    }
    const key = httpBoundaryKey(boundary);
    if (boundaryKeys.has(key)) {
      return {
        ok: false,
        detail: `Contract required_candidate_http_boundaries contains duplicate ${key}.`
      };
    }
    boundaryKeys.add(key);
  }
  if (
    !Array.isArray(contract.required_audience_http_boundaries) ||
    !contract.required_audience_http_boundaries.length
  ) {
    return {
      ok: false,
      detail: "Contract required_audience_http_boundaries must be a non-empty array."
    };
  }
  const audienceBoundaryKeys = new Set();
  for (const boundary of contract.required_audience_http_boundaries) {
    if (
      !validHttpBoundaryContract(boundary) ||
      !["candidate_anonymous", "production"].includes(normalizeText(boundary.audience).toLowerCase())
    ) {
      return {
        ok: false,
        detail: "Each required_audience_http_boundaries entry must define candidate_anonymous or production audience plus a valid HTTP boundary."
      };
    }
    const key = audienceBoundaryKey(boundary);
    if (audienceBoundaryKeys.has(key)) {
      return {
        ok: false,
        detail: `Contract required_audience_http_boundaries contains duplicate ${key}.`
      };
    }
    audienceBoundaryKeys.add(key);
  }
  return { ok: true, contract };
}

function resultFromReasons(reasons, checks, evidence) {
  const result = reasons.length ? "STOP" : "PASS";
  return {
    ok: result === "PASS",
    receipt: {
      schema: "werkles.production-release-integrity-receipt/v1",
      result,
      checks,
      evidence,
      reasons
    }
  };
}

function emptyChecks() {
  return {
    worktree_clean: false,
    head_matches_approved_sha: false,
    app_paths_complete: false,
    candidate_deployment_id_matches: false,
    candidate_name_matches: false,
    candidate_target_matches: false,
    candidate_ready: false,
    candidate_routes_complete: false,
    candidate_http_boundaries_complete: false,
    audience_boundary_deployments_match: false,
    audience_http_boundaries_complete: false,
    provenance_deployment_matches_candidate: false,
    provenance_sha_matches_approved: false,
    provenance_source_matches: false
  };
}

function emptyEvidence(input) {
  return {
    head_sha: normalizeSha(input.headSha) || null,
    approved_sha: normalizeSha(input.approvedSha) || null,
    approved_deployment_id: normalizeDeploymentId(input.approvedDeploymentId) || null,
    production_deployment_id: normalizeDeploymentId(input.productionDeploymentId) || null,
    dirty: typeof input.dirty === "boolean" ? input.dirty : null,
    candidate_deployment_id: deploymentIdFromObject(input.candidate) || null,
    candidate_name: input.candidate?.name ?? null,
    candidate_target: input.candidate?.target ?? null,
    candidate_ready_state: input.candidate?.readyState ?? null,
    provenance_deployment_id: deploymentIdFromObject(input.provenance) || null,
    source_sha: normalizeSha(input.provenance?.gitSource?.sha) || null,
    source_type: normalizeText(input.provenance?.gitSource?.type) || null,
    source_repo_id: normalizeText(input.provenance?.gitSource?.repoId) || null,
    source_github_org: normalizeText(
      input.provenance?.meta?.githubCommitOrg ?? input.provenance?.meta?.githubOrg
    ) || null,
    source_github_repo: normalizeText(
      input.provenance?.meta?.githubCommitRepo ?? input.provenance?.meta?.githubRepo
    ) || null,
    candidate_http_deployment_id: normalizeDeploymentId(
      input.candidateHttpBoundaries?.deployment_id
    ) || null,
    candidate_http_boundary_count: Array.isArray(input.candidateHttpBoundaries?.responses)
      ? input.candidateHttpBoundaries.responses.length
      : 0,
    audience_candidate_deployment_id: normalizeDeploymentId(
      input.audienceHttpBoundaries?.candidate_deployment_id
    ) || null,
    audience_production_deployment_id: normalizeDeploymentId(
      input.audienceHttpBoundaries?.production_deployment_id
    ) || null,
    audience_http_boundary_count: Array.isArray(input.audienceHttpBoundaries?.responses)
      ? input.audienceHttpBoundaries.responses.length
      : 0,
    app_path_count: 0,
    candidate_route_count: 0,
    missing_app_paths: [],
    missing_candidate_routes: [],
    missing_candidate_http_boundaries: [],
    failed_candidate_http_boundaries: [],
    missing_audience_http_boundaries: [],
    failed_audience_http_boundaries: []
  };
}

function normalizeSha(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeDeploymentId(value) {
  return String(value ?? "").trim();
}

function deploymentIdFromObject(value) {
  if (!isPlainObject(value)) return "";
  return normalizeDeploymentId(value.id ?? value.uid);
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function display(value) {
  const text = String(value ?? "").trim();
  return text || "<missing>";
}

function parseArgs(argv) {
  const input = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => argv[++index] ?? "";

    if (arg === "--approved-sha") input.approvedSha = next();
    else if (arg === "--approved-deployment-id") input.approvedDeploymentId = next();
    else if (arg === "--production-deployment-id") input.productionDeploymentId = next();
    else if (arg === "--candidate") input.candidatePath = next();
    else if (arg === "--provenance") input.provenancePath = next();
    else if (arg === "--candidate-http-boundaries") input.candidateHttpBoundariesPath = next();
    else if (arg === "--audience-http-boundaries") input.audienceHttpBoundariesPath = next();
    else if (arg === "--contract") input.contractPath = next();
    else if (arg === "--app-paths-manifest") input.appPathsManifestPath = next();
    else if (arg === "--repo-root") input.repoRoot = next();
    else if (arg === "--json") input.json = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return input;
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function gitOutput(repoRoot, args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (!args.approvedSha) throw new Error("--approved-sha is required.");
    if (!args.approvedDeploymentId) throw new Error("--approved-deployment-id is required.");
    if (!args.productionDeploymentId) throw new Error("--production-deployment-id is required.");
    if (!args.candidatePath) throw new Error("--candidate is required.");
    if (!args.provenancePath) throw new Error("--provenance is required.");
    if (!args.candidateHttpBoundariesPath) {
      throw new Error("--candidate-http-boundaries is required.");
    }
    if (!args.audienceHttpBoundariesPath) {
      throw new Error("--audience-http-boundaries is required.");
    }

    const repoRoot = path.resolve(args.repoRoot ?? process.cwd());
    const contractPath = path.resolve(repoRoot, args.contractPath ?? DEFAULT_RELEASE_CONTRACT);
    const manifestPath = path.resolve(repoRoot, args.appPathsManifestPath ?? DEFAULT_APP_PATHS_MANIFEST);
    const candidatePath = path.resolve(repoRoot, args.candidatePath);
    const provenancePath = path.resolve(repoRoot, args.provenancePath);
    const candidateHttpBoundariesPath = path.resolve(repoRoot, args.candidateHttpBoundariesPath);
    const audienceHttpBoundariesPath = path.resolve(repoRoot, args.audienceHttpBoundariesPath);
    const headSha = gitOutput(repoRoot, ["rev-parse", "HEAD"]);
    const dirty = gitOutput(repoRoot, ["status", "--porcelain=v1"]).length > 0;

    const result = evaluateProductionReleaseIntegrity({
      contract: readJson(contractPath),
      dirty,
      headSha,
      approvedSha: args.approvedSha,
      approvedDeploymentId: args.approvedDeploymentId,
      productionDeploymentId: args.productionDeploymentId,
      appPathsManifest: readJson(manifestPath),
      candidate: readJson(candidatePath),
      provenance: readJson(provenancePath),
      candidateHttpBoundaries: readJson(candidateHttpBoundariesPath),
      audienceHttpBoundaries: readJson(audienceHttpBoundariesPath)
    });

    if (args.json) {
      console.log(JSON.stringify(result.receipt, null, 2));
    } else {
      console.log(`release_guard_result=${result.receipt.result}`);
      console.log(`head_sha=${result.receipt.evidence.head_sha ?? ""}`);
      console.log(`approved_sha=${result.receipt.evidence.approved_sha ?? ""}`);
      console.log(`candidate_deployment_id=${result.receipt.evidence.candidate_deployment_id ?? ""}`);
      console.log(`production_deployment_id=${result.receipt.evidence.production_deployment_id ?? ""}`);
      console.log(`source_sha=${result.receipt.evidence.source_sha ?? ""}`);
      console.log(
        `candidate_http_deployment_id=${result.receipt.evidence.candidate_http_deployment_id ?? ""}`
      );
      for (const reason of result.receipt.reasons) {
        console.log(`reason=${reason.code}: ${reason.detail}`);
      }
    }

    process.exit(result.ok ? 0 : 1);
  } catch (error) {
    console.error(`release_guard_error=${error.message}`);
    process.exit(2);
  }
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  main();
}
