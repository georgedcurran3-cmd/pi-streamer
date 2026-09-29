// Reject codecs the Pi 3B can't hardware-decode (VP8/VP9/AV1) and anything above 720p.
(() => {
  const blocked = /vp0?[89]|av01|av1/i;
  const tooBig = (t) => {
    const w = /width=(\d+)/.exec(t);
    const h = /height=(\d+)/.exec(t);
    return (w && +w[1] > 1280) || (h && +h[1] > 720);
  };
  const bad = (t) => blocked.test(t) || tooBig(t);
  const wrap = (obj, name) => {
    if (!obj || !obj[name]) return;
    const orig = obj[name].bind(obj);
    obj[name] = (t) => (bad(String(t)) ? false : orig(t));
  };
  wrap(window.MediaSource, "isTypeSupported");
  wrap(window.ManagedMediaSource, "isTypeSupported");
  const canPlay = HTMLMediaElement.prototype.canPlayType;
  HTMLMediaElement.prototype.canPlayType = function (t) {
    return bad(String(t)) ? "" : canPlay.call(this, t);
  };
  if (navigator.mediaCapabilities) {
    const dec = navigator.mediaCapabilities.decodingInfo.bind(navigator.mediaCapabilities);
    navigator.mediaCapabilities.decodingInfo = (c) => {
      const v = c && c.video;
      if (v && (blocked.test(v.contentType || "") || v.width > 1280 || v.height > 720)) {
        return Promise.resolve({ supported: false, smooth: false, powerEfficient: false });
      }
      return dec(c);
    };
  }
})();
