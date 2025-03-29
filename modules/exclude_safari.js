

function testSafari() {
  const is_safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if (is_safari) {
    displayModal()
  }
}

function displayModal() {
  document.body.insertAdjacentHTML("afterbegin", `
    <div class="modal fade" id="safari-modal" tabindex="-1" aria-labelledby="safari-modal-label" aria-hidden="false">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-danger">
            <h1 class="modal-title fs-5" id="safari-modal-label">Safari is not supported</h1>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            Safari browser does not support this site. Please use Firefox or any chromium-based browser.
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>`)
  const modal = new bootstrap.Modal(document.getElementById('safari-modal'))
  modal.show()
  console.log(document.getElementById("safari-modal"))
}

export { testSafari }