const playerBody = document.querySelector(".iBody");
const dragHandle = document.querySelector(".iBody");

if (playerBody && dragHandle) {
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let originX = 0;
  let originY = 0;

  function getVarPx(name) {
    const value = getComputedStyle(playerBody).getPropertyValue(name).trim();
    return parseFloat(value || "0") || 0;
  }

  function onPointerDown(e) {
    const target = e.target;

    if (
      target.closest(".iDisplay") ||
      target.closest(".iWheel")
    ) {
      return;
    }

    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    originX = getVarPx("--drag-x");
    originY = getVarPx("--drag-y");

    dragHandle.setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e) {
    if (!dragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    playerBody.style.setProperty("--drag-x", `${originX + dx}px`);
    playerBody.style.setProperty("--drag-y", `${originY + dy}px`);
  }

  function onPointerUp(e) {
    dragging = false;
    dragHandle.releasePointerCapture?.(e.pointerId);
  }

  dragHandle.addEventListener("pointerdown", onPointerDown);
  dragHandle.addEventListener("pointermove", onPointerMove);
  dragHandle.addEventListener("pointerup", onPointerUp);
  dragHandle.addEventListener("pointercancel", onPointerUp);
}
