// Central list of Forever Minutes order statuses.
// Keeping this in one place avoids "magic string" typos across controllers/sockets.
export const MINUTE_ORDER_STATUS = {
  PLACED: "placed",
  SEARCHING_RIDER: "searching_rider",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  ARRIVED_AT_STORE: "arrived_at_store",
  PICKED_UP: "picked_up",
  OUT_FOR_DELIVERY: "out_for_delivery",
  ARRIVED_AT_CUSTOMER: "arrived_at_customer",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

export const RIDER_STATUS = {
  ONLINE: "online",
  OFFLINE: "offline",
  ON_DELIVERY: "on_delivery",
};

export const TRACKING_EVENTS = {
  JOIN_ORDER: "join-order",
  LEAVE_ORDER: "leave-order",
  LOCATION_UPDATE: "location-update",
  NEW_ORDER: "new-order",
  ACCEPT_ORDER: "accept-order",
  REJECT_ORDER: "reject-order",
  PICKUP_ORDER: "pickup-order",
  DELIVERED_ORDER: "delivered-order",
  ARRIVED_AT_CUSTOMER: "arrived-at-customer",
  CUSTOMER_CONNECTED: "customer-connected",
  RIDER_CONNECTED: "rider-connected",
  DISCONNECT: "disconnect",
};
