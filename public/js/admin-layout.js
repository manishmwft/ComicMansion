(function () {
  document.addEventListener("DOMContentLoaded", function () {
    const sidebarToggle = document.getElementById("kmSidebarToggle");

    if (sidebarToggle) {
      sidebarToggle.addEventListener("click", function () {
        document.body.classList.toggle("km-sidebar-collapsed");

        localStorage.setItem(
          "km_sidebar_collapsed",
          document.body.classList.contains("km-sidebar-collapsed")
        );
      });
    }

    document.querySelectorAll("[data-submenu-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const group = btn.closest(".km-menu-group");
        if (!group) return;

        group.classList.toggle("open");
      });
    });

    if (localStorage.getItem("km_sidebar_collapsed") === "true") {
      document.body.classList.add("km-sidebar-collapsed");
    }

    const confirmDeleteBtn = document.getElementById("confirmDelete");

    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener("click", function () {
        if (window.deleteUrl) {
          window.location.href = window.deleteUrl;
        }
      });
    }
  });

  window.openDeleteModal = function (id, baseUrl) {
    window.deleteUrl = baseUrl + id;

    const modalElement = document.getElementById("deleteModal");

    if (!modalElement || typeof bootstrap === "undefined") {
      window.location.href = window.deleteUrl;
      return;
    }

    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  };

  window.showToast = function (message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast align-items-center text-bg-${type} border-0 show mb-2`;

    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button
          type="button"
          class="btn-close btn-close-white me-2 m-auto"
          aria-label="Close"
          onclick="this.closest('.toast').remove()"
        ></button>
      </div>
    `;

    container.appendChild(toast);

    setTimeout(function () {
      if (toast && toast.parentNode) {
        toast.remove();
      }
    }, 3000);
  };
})();