import React from "react";
import UserDashboard from "./UserDashboard";

export default function AccountModal({
  user = {},
  history = [],
  onClose,
  onAddReview,
  onLogout,
  onTakeTest,
  onViewProducts,
  onBookDermatologist,
}) {
  return (
    <UserDashboard
      user={user}
      history={history}
      onClose={onClose}
      onAddReview={onAddReview}
      onLogout={onLogout}
      onTakeTest={onTakeTest}
      onViewProducts={onViewProducts}
      onBookDermatologist={onBookDermatologist}
    />
  );
}