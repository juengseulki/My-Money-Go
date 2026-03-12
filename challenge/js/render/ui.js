const loadingOverlay = document.getElementById("loading-overlay");
const toastContainer = document.getElementById("toast-container");

const confirmModal = document.getElementById("confirm-modal");
const confirmTitle = document.getElementById("confirm-title");
const confirmMessage = document.getElementById("confirm-message");
const confirmOk = document.getElementById("confirm-ok");
const confirmCancel = document.getElementById("confirm-cancel");
const confirmIcon = document.getElementById("confirm-icon");

export function showLoading() {
  loadingOverlay.classList.remove("hidden");
}

export function hideLoading() {
  loadingOverlay.classList.add("hidden");
}

export function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2500);
}

export function showConfirmModal({
  title = "정말 진행하시겠습니까?",
  message = "이 작업은 되돌릴 수 없습니다.",
  confirmText = "확인",
  cancelText = "취소",
  icon = "⚠️",
} = {}) {
  return new Promise((resolve) => {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmOk.textContent = confirmText;
    confirmCancel.textContent = cancelText;
    confirmIcon.textContent = icon;

    confirmModal.classList.remove("hidden");
    confirmOk.focus();

    const cleanup = () => {
      confirmOk.removeEventListener("click", handleConfirm);
      confirmCancel.removeEventListener("click", handleCancel);
      confirmModal.removeEventListener("click", handleOverlayClick);
      document.removeEventListener("keydown", handleKeydown);
    };

    const close = (result) => {
      confirmModal.classList.add("hidden");
      cleanup();
      resolve(result);
    };

    const handleConfirm = () => close(true);
    const handleCancel = () => close(false);

    const handleOverlayClick = (event) => {
      if (event.target === confirmModal) {
        close(false);
      }
    };

    const handleKeydown = (event) => {
      if (event.key === "Escape") {
        close(false);
      }
    };

    confirmOk.addEventListener("click", handleConfirm);
    confirmCancel.addEventListener("click", handleCancel);
    confirmModal.addEventListener("click", handleOverlayClick);
    document.addEventListener("keydown", handleKeydown);
  });
}
