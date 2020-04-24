/**
 * Main method for the panel
 * @argument {string} url
 */
window.initializePanel = function(url) {
  function spawnSocket() {
    const sock = new WebSocket(url);

    sock.addEventListener('message', ({ data }) => {
      let payload;
      try {
        payload = JSON.parse(data);
      } catch {
        console.warn('Malformed payload from server.');
        return;
      }

      for (let [key, value] of Object.entries(payload)) {
        switch (key) {
          case "state":
            for (let [stateKey, stateValue] of Object.entries(value)) {
              switch (stateKey) {
                case "gradient":
                  gradientChanged(stateValue.color, stateValue.transition);
              }
            }
            break;
        }
      }
    });

    sock.addEventListener('close', () => {
      console.warn('Socket disconnected from the server. Reconnecting in 5000ms');

      setTimeout(() => spawnSocket(), 5000);
    });

    sock.addEventListener('open', () => {
      console.debug('Connected to server.');
    });
  }

  spawnSocket();

  const colorHolder = document.getElementById("color-holder");
  const colorView = document.getElementById("color-view");
  const transitionHolder = document.getElementById("transition-holder");

  /**
   * Called when the color is changing
   * @param {string} color 
   * @param {number} transition 
   */
  function gradientChanged(color, transition) {
    colorHolder.innerText = color;
    colorView.style.backgroundColor = color;
    colorView.style.transitionDuration = transitionHolder.innerText = `${transition}ms`;
  }

  const rotationController = document.getElementById("toggle-rotation");
  const resetController = document.getElementById("reset-color");
  const logoutController = document.getElementById("logout");

  function getRotationState() {
    return fetch("/admin/api/rotation").then(res => res.json()).then(res => !!res.rotating);
  }

  function setRotationState(rotating = false) {
    return fetch("/admin/api/rotation", {
      method: "put",
      body: JSON.stringify({ rotating }),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(res => res.json()).then(res => !!res.ok);
  }

  function resetLights() {
    return fetch("/admin/api/reset", {
      method: "post"
    });
  }

  getRotationState().then(rotating => {
    function updateRotationText() {
      rotationController.innerText = `Rotation ${rotating ? 'enabled' : 'disabled'}`;
    }

    var _rotationBusy = false;
    rotationController.addEventListener('click', () => {
      if (_rotationBusy) return;
      _rotationBusy = true;
      setRotationState(!rotating).then(() => {
        rotating = !rotating;
        _rotationBusy = false;
        updateRotationText();
      });
    });

    updateRotationText();
  });

  var _resetBusy = false;  
  resetController.addEventListener('click', () => {
    if (_resetBusy) return;
    _resetBusy = true;
    resetLights().then(() => _resetBusy = false);
  });

  logoutController.addEventListener('click', () => {
    window.location = '/logout'
  })
}