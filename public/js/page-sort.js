"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const pageReorderRoot =
    document.getElementById("pageReorderRoot");

  if (!pageReorderRoot) {
    return;
  }

  const episodeId =
    pageReorderRoot.dataset.episodeId;

  const gridView =
    document.getElementById("gridView");

  const listView =
    document.getElementById("listView");

  const gridButton =
    document.getElementById("gridViewButton");

  const listButton =
    document.getElementById("listViewButton");

  let draggedElement = null;
  let isSavingOrder = false;

  function setPageView(type) {
    if (!gridView || !listView) {
      return;
    }

    if (type === "list") {
      gridView.style.display = "none";
      listView.style.display = "block";

      gridButton?.classList.remove("active");
      listButton?.classList.add("active");
    } else {
      gridView.style.display = "block";
      listView.style.display = "none";

      listButton?.classList.remove("active");
      gridButton?.classList.add("active");
    }

    localStorage.setItem(
      "pagesViewMode",
      type
    );
  }

  function getDragInsertBefore(
    container,
    pointerX,
    pointerY,
    isGrid
  ) {
    const elements = [
      ...container.querySelectorAll(
        [
          ".page-sort-card:not(.dragging)",
          ".page-sort-row:not(.dragging)",
        ].join(",")
      ),
    ];

    if (elements.length === 0) {
      return null;
    }

    if (!isGrid) {
      return elements.reduce(
        (closest, element) => {
          const box =
            element.getBoundingClientRect();

          const offset =
            pointerY -
            box.top -
            box.height / 2;

          if (
            offset < 0 &&
            offset > closest.offset
          ) {
            return {
              offset,
              element,
            };
          }

          return closest;
        },
        {
          offset:
            Number.NEGATIVE_INFINITY,
          element: null,
        }
      ).element;
    }

    let nearest = null;

    let nearestDistance =
      Number.POSITIVE_INFINITY;

    elements.forEach((element) => {
      const box =
        element.getBoundingClientRect();

      const centerX =
        box.left + box.width / 2;

      const centerY =
        box.top + box.height / 2;

      const distance =
        Math.pow(
          pointerX - centerX,
          2
        ) +
        Math.pow(
          pointerY - centerY,
          2
        );

      if (
        distance < nearestDistance
      ) {
        nearest = element;
        nearestDistance = distance;
      }
    });

    if (!nearest) {
      return null;
    }

    const nearestBox =
      nearest.getBoundingClientRect();

    const pointerAfterVerticalCenter =
      pointerY >
      nearestBox.top +
        nearestBox.height / 2;

    const pointerNearSameRow =
      Math.abs(
        pointerY -
          (
            nearestBox.top +
            nearestBox.height / 2
          )
      ) <
      nearestBox.height / 3;

    const pointerAfterHorizontalCenter =
      pointerX >
      nearestBox.left +
        nearestBox.width / 2;

    const shouldInsertAfter =
      pointerAfterVerticalCenter ||
      (
        pointerNearSameRow &&
        pointerAfterHorizontalCenter
      );

    return shouldInsertAfter
      ? nearest.nextElementSibling
      : nearest;
  }

  function setupSortable(containerId) {
    const container =
      document.getElementById(
        containerId
      );

    if (!container) {
      return;
    }

    const selector =
      containerId === "sortableGrid"
        ? ".page-sort-card"
        : ".page-sort-row";

    container
      .querySelectorAll(selector)
      .forEach((item) => {
        item.addEventListener(
          "dragstart",
          (event) => {
            draggedElement = item;

            item.classList.add(
              "dragging"
            );

            if (
              event.dataTransfer
            ) {
              event.dataTransfer.effectAllowed =
                "move";

              event.dataTransfer.setData(
                "text/plain",
                item.dataset.pageId || ""
              );
            }
          }
        );

        item.addEventListener(
          "dragend",
          async () => {
            item.classList.remove(
              "dragging"
            );

            draggedElement = null;

            synchronizeViews(
              containerId
            );

            updatePageLabels();

            await savePageOrder();
          }
        );
      });

    container.addEventListener(
      "dragover",
      (event) => {
        event.preventDefault();

        if (
          !draggedElement ||
          !container.contains(
            draggedElement
          )
        ) {
          return;
        }

        if (event.dataTransfer) {
          event.dataTransfer.dropEffect =
            "move";
        }

        const insertBefore =
          getDragInsertBefore(
            container,
            event.clientX,
            event.clientY,
            containerId ===
              "sortableGrid"
          );

        if (insertBefore == null) {
          container.appendChild(
            draggedElement
          );
        } else if (
          insertBefore !==
          draggedElement
        ) {
          container.insertBefore(
            draggedElement,
            insertBefore
          );
        }
      }
    );

    container.addEventListener(
      "drop",
      (event) => {
        event.preventDefault();
      }
    );
  }

  function synchronizeViews(
    sourceContainerId
  ) {
    const source =
      document.getElementById(
        sourceContainerId
      );

    const targetId =
      sourceContainerId ===
      "sortableGrid"
        ? "sortableList"
        : "sortableGrid";

    const target =
      document.getElementById(
        targetId
      );

    if (!source || !target) {
      return;
    }

    const orderedIds = [
      ...source.querySelectorAll(
        "[data-page-id]"
      ),
    ].map(
      (element) =>
        element.dataset.pageId
    );

    orderedIds.forEach((pageId) => {
      const matchingElement = [
        ...target.querySelectorAll(
          "[data-page-id]"
        ),
      ].find(
        (element) =>
          element.dataset.pageId ===
          pageId
      );

      if (matchingElement) {
        target.appendChild(
          matchingElement
        );
      }
    });
  }

  function updatePageLabels() {
    [
      "sortableGrid",
      "sortableList",
    ].forEach((containerId) => {
      const container =
        document.getElementById(
          containerId
        );

      if (!container) {
        return;
      }

      container
        .querySelectorAll(
          "[data-page-id]"
        )
        .forEach(
          (item, index) => {
            const pageNumber =
              index + 1;

            const badge =
              item.querySelector(
                ".page-number-badge"
              );

            if (badge) {
              badge.textContent =
                `Page ${pageNumber}`;
            }

            const image =
              item.querySelector("img");

            if (image) {
              image.alt =
                `Page ${pageNumber}`;
            }
          }
        );
    });
  }

  function showOrderStatus(
    type,
    message
  ) {
    const status =
      document.getElementById(
        "orderStatus"
      );

    if (!status) {
      return;
    }

    let alertClass =
      "alert-info";

    if (type === "success") {
      alertClass =
        "alert-success";
    }

    if (type === "error") {
      alertClass =
        "alert-danger";
    }

    status.innerHTML = `
      <div
        class="alert ${alertClass} py-2 mb-0"
        role="alert"
      >
        ${message}
      </div>
    `;
  }

  async function savePageOrder() {
    if (isSavingOrder) {
      return;
    }

    const grid =
      document.getElementById(
        "sortableGrid"
      );

    if (!grid) {
      return;
    }

    const pageIds = [
      ...grid.querySelectorAll(
        "[data-page-id]"
      ),
    ].map(
      (element) =>
        element.dataset.pageId
    );

    if (
      !episodeId ||
      pageIds.length === 0
    ) {
      showOrderStatus(
        "error",
        "Episode or page information is missing."
      );

      return;
    }

    isSavingOrder = true;

    showOrderStatus(
      "info",
      [
        '<span class="spinner-border ',
        'spinner-border-sm me-2">',
        "</span>",
        "Saving page order...",
      ].join("")
    );

    try {
      const response = await fetch(
        "/admin/pages/reorder",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
          },
          credentials:
            "same-origin",
          body: JSON.stringify({
            episode_id:
              episodeId,
            page_ids: pageIds,
          }),
        }
      );

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      let result;

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        result =
          await response.json();
      } else {
        const responseText =
          await response.text();

        throw new Error(
          response.status === 404
            ? "Page reorder API was not found."
            : responseText ||
                "The server returned an invalid response."
        );
      }

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Failed to update page order."
        );
      }

      showOrderStatus(
        "success",
        [
          '<i class="bi ',
          'bi-check-circle me-2">',
          "</i>",
          "Page order updated successfully.",
        ].join("")
      );

      window.setTimeout(() => {
        const status =
          document.getElementById(
            "orderStatus"
          );

        if (status) {
          status.innerHTML = "";
        }
      }, 2500);
    } catch (error) {
      console.error(
        "Page reorder failed:",
        error
      );

      showOrderStatus(
        "error",
        [
          '<i class="bi ',
          'bi-exclamation-triangle ',
          'me-2"></i>',
          escapeHtml(
            error.message ||
              "Unable to save page order."
          ),
        ].join("")
      );
    } finally {
      isSavingOrder = false;
    }
  }

  function escapeHtml(value) {
    const element =
      document.createElement("div");

    element.textContent =
      String(value || "");

    return element.innerHTML;
  }

  gridButton?.addEventListener(
    "click",
    () => {
      setPageView("grid");
    }
  );

  listButton?.addEventListener(
    "click",
    () => {
      setPageView("list");
    }
  );

  document
    .querySelectorAll(
      ".js-delete-page"
    )
    .forEach((link) => {
      link.addEventListener(
        "click",
        (event) => {
          const confirmed =
            window.confirm(
              "Are you sure you want to delete this page?"
            );

          if (!confirmed) {
            event.preventDefault();
          }
        }
      );
    });

  const savedView =
    localStorage.getItem(
      "pagesViewMode"
    ) || "grid";

  setPageView(savedView);
  setupSortable("sortableGrid");
  setupSortable("sortableList");
  updatePageLabels();
});