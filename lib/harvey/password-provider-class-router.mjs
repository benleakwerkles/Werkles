import { createHash } from 'node:crypto';

const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const HASH = /^[a-f0-9]{64}$/;
export const PASSWORD_PROVIDER_CLASSES = Object.freeze([
  'NATIVE_ADMIN_API',
  'NATIVE_SELF_SERVICE_API',
  'WEB_CURRENT_PASSWORD_CHANGE',
  'WEB_EMAIL_RESET',
  'FEDERATED_IDENTITY_PROVIDER',
  'PASSWORDLESS_ONLY',
  'HUMAN_SUPPORT_RECOVERY',
]);

function validate(target) {
  const keys = ['account', 'adapter', 'class', 'provider', 'source'];
  if (!target || Object.keys(target).sort().join('|') !== keys.sort().join('|')
    || !HASH.test(target.account ?? '') || !HASH.test(target.adapter ?? '')
    || !PASSWORD_PROVIDER_CLASSES.includes(target.class)
    || typeof target.provider !== 'string' || !target.provider.trim()
    || typeof target.source !== 'string' || !target.source.startsWith('https://')) throw new Error('PASSWORD_PROVIDER_TARGET_INVALID');
}

/** Routes every account model without pretending each model has a password.
 * Only a bound native adapter may mutate unattended. Web flows deliberately
 * stop before final password submission; federated/passwordless routes point
 * to their actual owning identity rather than manufacturing a local password.
 */
export async function routePasswordProviderClass({ target, nativeAdapters = new Map(), webAdapters = new Map(), executeNative, executeWeb }) {
  validate(target);
  const custody = digest(target);
  if (target.class === 'NATIVE_ADMIN_API' || target.class === 'NATIVE_SELF_SERVICE_API') {
    const adapter = nativeAdapters.get(target.adapter);
    if (!adapter || adapter.digest !== target.adapter || adapter.provider !== target.provider
      || adapter.class !== target.class || typeof executeNative !== 'function') throw new Error('PASSWORD_NATIVE_ADAPTER_UNAVAILABLE');
    const result = await executeNative(adapter);
    if (!result || result.state !== 'VERIFIED_CONVERSION' || result.counted !== true) {
      return Object.freeze({ state: 'NATIVE_CONVERSION_UNPROVEN', provider: target.provider, class: target.class, custody, converted: false });
    }
    return Object.freeze({ state: 'VERIFIED_CONVERSION', provider: target.provider, class: target.class, custody, converted: true });
  }
  if (target.class === 'WEB_CURRENT_PASSWORD_CHANGE' || target.class === 'WEB_EMAIL_RESET') {
    const adapter = webAdapters.get(target.adapter);
    if (adapter) {
      if (adapter.digest !== target.adapter || adapter.provider !== target.provider
        || adapter.class !== target.class || typeof executeWeb !== 'function') throw new Error('PASSWORD_WEB_ADAPTER_UNAVAILABLE');
      const result = await executeWeb(adapter);
      if (!result || result.state !== 'VERIFIED_CONVERSION' || result.counted !== true) {
        return Object.freeze({ state: 'WEB_CONVERSION_UNPROVEN', provider: target.provider, class: target.class, custody, converted: false });
      }
      return Object.freeze({ state: 'VERIFIED_CONVERSION', provider: target.provider, class: target.class, custody, converted: true });
    }
  }
  const states = {
    WEB_CURRENT_PASSWORD_CHANGE: 'FINAL_PASSWORD_SUBMISSION_REQUIRES_INTERACTIVE_HANDOFF',
    WEB_EMAIL_RESET: 'RESET_LINK_CAN_BE_RECOVERED__FINAL_PASSWORD_SUBMISSION_REQUIRES_INTERACTIVE_HANDOFF',
    FEDERATED_IDENTITY_PROVIDER: 'PASSWORD_OWNED_BY_UPSTREAM_IDENTITY_PROVIDER',
    PASSWORDLESS_ONLY: 'NO_PROVIDER_PASSWORD_EXISTS',
    HUMAN_SUPPORT_RECOVERY: 'PROVIDER_SUPPORT_IDENTITY_REVIEW_REQUIRED',
  };
  return Object.freeze({ state: states[target.class], provider: target.provider, class: target.class, custody, converted: false });
}

export function bindNativeProviderAdapter({ provider, providerClass, digest: adapterDigest, run }) {
  if (!['NATIVE_ADMIN_API', 'NATIVE_SELF_SERVICE_API'].includes(providerClass)
    || !HASH.test(adapterDigest ?? '') || typeof provider !== 'string' || !provider || typeof run !== 'function') throw new Error('PASSWORD_NATIVE_ADAPTER_INVALID');
  return Object.freeze({ provider, class: providerClass, digest: adapterDigest, run });
}

/** Binds one exact background-web conversion composition. The bound runner must
 * itself prove provider change acceptance, a fresh signed-out login, and exact-one
 * vault reconciliation before returning VERIFIED_CONVERSION. This router never
 * receives credential material or generic browser input authority.
 */
export function bindWebProviderAdapter({ provider, providerClass, digest: adapterDigest, run }) {
  if (!['WEB_CURRENT_PASSWORD_CHANGE', 'WEB_EMAIL_RESET'].includes(providerClass)
    || !HASH.test(adapterDigest ?? '') || typeof provider !== 'string' || !provider || typeof run !== 'function') throw new Error('PASSWORD_WEB_ADAPTER_INVALID');
  return Object.freeze({ provider, class: providerClass, digest: adapterDigest, run });
}
