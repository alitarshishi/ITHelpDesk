import * as signalR from "@microsoft/signalr";
import { getToken } from "./authService";

const HUB_URL =
  (process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api").replace(
    "/api",
    "",
  ) + "/hubs/notifications";

let connection = null;
let refCount = 0;

export function startConnection(onNotification) {
  refCount++;
  if (connection) {
    connection.off("ReceiveNotification");
    connection.on("ReceiveNotification", onNotification);
    return connection; // already connected
  }

  connection = new signalR.HubConnectionBuilder()

    .withUrl(HUB_URL, {
      accessTokenFactory: () => getToken(), // sent as ?access_token=... on the handshake
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // retry after 0s, 2s, 5s , 10s, 30s
    .build();

  connection.on("ReceiveNotification", onNotification);

  //  When reconnected after a disconnect, fire a custom window event
  // so NotificationBell can re-fetch the unread count from REST
  // (we may have missed notifications during the disconnect window)
  connection.onreconnected(() => {
    window.dispatchEvent(new CustomEvent("signalr-reconnected"));
  });

  connection.onclose(() => {
    console.warn("SignalR connection closed.");
  });

  connection.start().catch((err) => {
    console.error("SignalR connection failed:", err);
  });

  return connection;
}

export function stopConnection() {
  refCount--;
  if (refCount <= 0 && connection) {
    connection.stop();
    connection = null;
    refCount = 0;
  }
}
