const SMARTER_POOL_103_INTERNATIONAL = Object.freeze({
  id: 'smarter-pool-1.0.3-international',
  name: 'Smarter Pool 1.0.3 international',
  source: 'Smarter Pool Android app 1.0.3 international',
  appKey: 'upwq7qds9tvsmw7ujyt8',
  appSecret: '9vegpm85dpu38a9qr8sdhfamahkvf8pv',
  secret2: 'amp97pd53mw4sqcnwkjqwkm44997f7sg',
  certSign: 'A',
  region: 'EU',
  ttid: 'tuya_international',
});

function defaultAppProfile() {
  return SMARTER_POOL_103_INTERNATIONAL;
}

module.exports = {
  SMARTER_POOL_103_INTERNATIONAL,
  defaultAppProfile,
};
