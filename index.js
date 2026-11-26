(function (exports) {
  const toast = (t) => { try { vendetta.ui.toasts.showToast(String(t)); } catch (e) {} };
  let unpatch = null;

  exports.onLoad = () => {
    try {
      const { findByStoreName } = vendetta.metro;
      const { before } = vendetta.patcher;
      const store = findByStoreName("GatewayConnectionStore");
      const socket = store && store.getSocket && store.getSocket();
      if (!socket) return toast("Platform Spoof: no socket, restart Discord");

      const proto = Object.getPrototypeOf(socket);
      const target = proto && typeof proto.send === "function" ? proto : socket;
      if (typeof target.send !== "function") return toast("Platform Spoof: send not found");

      unpatch = before("send", target, (args) => {
        try {
          if (args[0] === 2 && args[1] && args[1].properties) {
            args[1].properties = Object.assign({}, args[1].properties, {
              os: "Windows",
              browser: "Discord Client",
              device: "",
              os_version: "10",
            });
            toast("Platform Spoof: identify patched");
          }
        } catch (e) {}
        return args;
      });
      toast("Platform Spoof ready");
    } catch (e) {
      toast("Platform Spoof error: " + (e && e.message ? e.message : e));
    }
  };

  exports.onUnload = () => { if (unpatch) { unpatch(); unpatch = null; } };
  return exports;
})({});
