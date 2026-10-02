import { createHash } from 'node:crypto';

import { canonicalJson } from './station-crypto-core.mjs';
import { runStewartBackgroundCredentialOperation } from './stewart-background-credential-operation.mjs';

const HASH = /^[a-f0-9]{64}$/;
const bindings = new WeakSet();
const digest = (value) => createHash('sha256').update(canonicalJson(value)).digest('hex');
const fail = (code) => { throw new Error(code); };

function brokerBinding(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).sort().join('|') !== ['credential_source_observation_sha256', 'dispatch_sha256', 'handle_id_sha256'].join('|')
    || !Object.values(value).every((entry) => HASH.test(entry ?? ''))) {
    fail('STEWART_BACKGROUND_WEB_PASSWORD_BROKER_BINDING_INVALID');
  }
  return Object.freeze({ ...value });
}

function commandFor(leg, expectedKind) {
  const command = leg?.compiled?.admission?.command;
  if (!command || leg.compiled.admission.decision !== 'EXECUTE_ONCE'
    || command.operation_kind !== expectedKind
    || !HASH.test(command.operation_id_sha256 ?? '')
    || !HASH.test(command.account_ref_sha256 ?? '')
    || !HASH.test(command.route_epoch_sha256 ?? '')
    || !HASH.test(command.tab_id_sha256 ?? '')
    || !Array.isArray(leg.handles)
    || !['consume', 'resolveHandle', 'executeBackgroundForm', 'readback'].every((key) => typeof leg[key] === 'function')) {
    fail('STEWART_BACKGROUND_WEB_PASSWORD_LEG_INVALID');
  }
  return command;
}

/**
 * Mints the only web object admitted by the Preordained password dispatcher.
 * Both callbacks call Stewart's signed exact-operation runner directly. A
 * signed-out session proof is derived only from an accepted, separately bound
 * PASSWORD_FALLBACK_SIGN_IN operation on a route distinct from the reset.
 */
export function createStewartBackgroundWebPasswordBinding({
  provider, providerClass, adapterDigest, account,
  changeBinding, signInBinding, change, signIn,
}) {
  if (typeof provider !== 'string' || !provider.trim()
    || !['WEB_CURRENT_PASSWORD_CHANGE', 'WEB_EMAIL_RESET'].includes(providerClass)
    || !HASH.test(adapterDigest ?? '') || !HASH.test(account ?? '')) {
    fail('STEWART_BACKGROUND_WEB_PASSWORD_BINDING_INVALID');
  }
  const changeCommand = commandFor(change, 'PASSWORD_RESET');
  const signInCommand = commandFor(signIn, 'PASSWORD_FALLBACK_SIGN_IN');
  if (changeCommand.account_ref_sha256 !== account || signInCommand.account_ref_sha256 !== account
    || changeCommand.operation_id_sha256 === signInCommand.operation_id_sha256
    || (changeCommand.route_epoch_sha256 === signInCommand.route_epoch_sha256
      && changeCommand.tab_id_sha256 === signInCommand.tab_id_sha256)) {
    fail('STEWART_BACKGROUND_WEB_PASSWORD_OPERATION_CUSTODY_CONFLICT');
  }
  const boundedChangeBinding = brokerBinding(changeBinding);
  const boundedSignInBinding = brokerBinding(signInBinding);
  const web = Object.freeze({
    provider, providerClass, adapterDigest, changeBinding: boundedChangeBinding, signInBinding: boundedSignInBinding,
    changeOnce: async () => runStewartBackgroundCredentialOperation(change),
    freshSignedOutSignInOnce: async () => {
      const receipt = await runStewartBackgroundCredentialOperation(signIn);
      return Object.freeze({
        account_ref_sha256: account,
        signed_out: true,
        session_sha256: digest({
          account_ref_sha256: account,
          operation_id_sha256: signInCommand.operation_id_sha256,
          route_epoch_sha256: signInCommand.route_epoch_sha256,
          tab_id_sha256: signInCommand.tab_id_sha256,
          provider_state_sha256: receipt.provider_state_sha256,
        }),
        receipt,
      });
    },
  });
  bindings.add(web);
  return web;
}

export function isStewartBackgroundWebPasswordBinding(value) {
  return bindings.has(value);
}
