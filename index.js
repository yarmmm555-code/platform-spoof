(function (exports) {
  const toast = (t) => { try { vendetta.ui.toasts.showToast(String(t)); } catch (e) {} };
  let unpatch = null;
  let patchedCount = 0;
  let lastInfo = "-";
  let loadMsg = "not loaded";

  const getSocket = () => {
    try {
      const store = vendetta.metro.findByStoreName("GatewayConnectionStore");
      return store && store.getSocket && store.getSocket();
    } catch (e) { return null; }
  };

  const reconnect = () => {
    try {
      const socket = getSocket();
      if (!socket) return toast("No socket");
      if (typeof socket.resetSocketOnError === "function") {
        socket.resetSocketOnError();
        toast("Reconnecting (reset)...");
      } else if (typeof socket.close === "function") {
        socket.close(1000, "spoof");
        toast("Reconnecting (close)...");
      } else {
        toast("No reconnect method, restart Discord");
      }
    } catch (e) {
      toast("Reconnect error: " + (e && e.message ? e.message : e));
    }
  };

  exports.onLoad = () => {
    try {
      const { before } = vendetta.patcher;
      const socket = getSocket();
      if (!socket) { loadMsg = "no socket"; return; }

      const proto = Object.getPrototypeOf(socket);
      const target = proto && typeof proto.send === "function" ? proto : socket;
      if (typeof target.send !== "function") { loadMsg = "send not found"; return; }

      unpatch = before("send", target, (args) => {
        try {
          if (args[0] === 2 && args[1] && args[1].properties) {
            args[1].properties = Object.assign({}, args[1].properties, {
              os: "Windows",
              browser: "Discord Client",
              device: "",
              os_version: "10",
            });
            patchedCount++;
            lastInfo = "browser=" + args[1].properties.browser + " os=" + args[1].properties.os;
          }
        } catch (e) {}
        return args;
      });
      loadMsg = "patch installed";
    } catch (e) {
      loadMsg = "error: " + (e && e.message ? e.message : e);
    }
  };

  exports.onUnload = () => { if (unpatch) { unpatch(); unpatch = null; } };

  exports.settings = () => {
    const { React, ReactNative } = vendetta.metro.common;
    const Forms = (vendetta.ui.components && vendetta.ui.components.Forms) || {};
    const Row = Forms.FormRow;
    const [, force] = React.useState(0);
    if (!Row) return React.createElement(ReactNative.Text, null, "UI not found");
    return React.createElement(
      ReactNative.ScrollView,
      null,
      React.createElement(Row, { label: "Status", subLabel: loadMsg }),
      React.createElement(Row, { label: "Identify patched", subLabel: String(patchedCount) + " times" }),
      React.createElement(Row, { label: "Last sent", subLabel: lastInfo }),
      React.createElement(Row, { label: "Reconnect now", subLabel: "Re-sends identify (if Discord drops, just reopen it)", onPress: () => { reconnect(); setTimeout(() => force((n) => n + 1), 3000); } }),
      React.createElement(Row, { label: "Refresh", onPress: () => force((n) => n + 1) })
    );
  };
  return exports;
})({});
