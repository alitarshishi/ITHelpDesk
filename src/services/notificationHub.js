import * as signalR from "@microsoft/signalr";
import { getToken } from "./authService";

const HUB_URL =
  (process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api").replace(
    "/api",
    "",
  ) + "/hubs/notifications";

let connection = null;

export function startConnection(onNotification) {
  if (connection) return connection; // already connected

  connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => getToken(), // sent as ?access_token=... on the handshake
    })
    .withAutomaticReconnect()
    .build();

  connection.on("ReceiveNotification", (notification) => {
    onNotification(notification);
  });

  connection.start().catch((err) => {
    console.error("SignalR connection failed:", err);
  });

  return connection;
}

export function stopConnection() {
  if (connection) {
    connection.stop();
    connection = null;
  }
}
