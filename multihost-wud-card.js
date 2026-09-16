class MultiHostWudCard extends HTMLElement {
  setConfig(config) {
    this._config = config;
  }

  static get REST_SERVICE() {
    return "rest_command";
  }
  static get WUD_REFRESH() {
    return "wud_refresh";
  }

  _setRefreshLoading(isLoading) {
    this._refreshLoading = isLoading;
    const refreshBtn = this.content?.querySelector("#wud-refresh-btn");
    const refreshIcon = refreshBtn?.querySelector("#wud-refresh-icon");

    if (!refreshBtn || !refreshIcon) return;

    refreshBtn.classList.toggle("is-loading", isLoading);
    refreshBtn.setAttribute("aria-busy", isLoading ? "true" : "false");
    refreshBtn.style.pointerEvents = isLoading ? "none" : "auto";
    refreshIcon.classList.toggle("is-spinning", isLoading);
  }

  _showRefreshSuccess() {
    let popup = this.querySelector(".wud-refresh-success");
    if (!popup) {
      popup = document.createElement("div");
      popup.className = "wud-refresh-success";
      popup.innerHTML = `
        <strong>Refresh requested</strong>
        <span class="wud-refresh-success-message">WUD container check triggered successfully.</span>
        <button type="button" class="wud-refresh-success-close" aria-label="Close">&times;</button>
      `;
      popup.querySelector(".wud-refresh-success-close").addEventListener("click", () => {
        popup.remove();
      });
      this.appendChild(popup);
    }

    popup.classList.add("is-visible");
    clearTimeout(this._refreshSuccessTimer);
    this._refreshSuccessTimer = setTimeout(() => popup.remove(), 3000);
  }

  _showRefreshError(error) {
    let popup = this.querySelector(".wud-refresh-error");
    if (!popup) {
      popup = document.createElement("div");
      popup.className = "wud-refresh-error";
      popup.innerHTML = `
        <strong>Refresh failed</strong>
        <span class="wud-refresh-error-message"></span>
        <button type="button" class="wud-refresh-error-close" aria-label="Close">&times;</button>
      `;
      popup.querySelector(".wud-refresh-error-close").addEventListener("click", () => {
        popup.remove();
      });
      this.appendChild(popup);
    }

    if (error.translation_key == 'service_not_found') {
      popup.querySelector(".wud-refresh-error-message").textContent = "The WUD refresh service is not available. Please ensure the REST service has been defined in your Home Assistant configuration.";
    } else {
      const message = error?.message || "Home Assistant could not start the refresh.";
      popup.querySelector(".wud-refresh-error-message").textContent = message;
    }
    popup.classList.add("is-visible");
    clearTimeout(this._refreshErrorTimer);
    this._refreshErrorTimer = setTimeout(() => popup.remove(), 6000);
  }
  
  _getHeading(totalUpdates, totalUpToDate) {
    const isChecked = this._showOnlyUpdates ? "checked" : "";

    return `
      <style>
        @keyframes wud-refresh-spin {
          to { transform: rotate(360deg); }
        }
        #wud-refresh-icon.is-spinning {
          animation: wud-refresh-spin 0.8s linear infinite;
        }
        #wud-refresh-btn.is-loading {
          opacity: 0.8;
        }
        .wud-refresh-error {
          position: fixed;
          top: 16px;
          right: 16px;
          z-index: 1000;
          display: none;
          max-width: 320px;
          padding: 12px 36px 12px 14px;
          border-left: 4px solid var(--error-color, #f44336);
          border-radius: 4px;
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color, #212121);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
        }
        .wud-refresh-error.is-visible {
          display: block;
        }
        .wud-refresh-error-message {
          display: block;
          margin-top: 4px;
          color: var(--secondary-text-color);
          font-size: 13px;
        }
        .wud-refresh-error-close {
          position: absolute;
          top: 8px;
          right: 8px;
          border: 0;
          background: transparent;
          color: inherit;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
        }

        .wud-refresh-success {
          position: fixed;
          top: 16px;
          right: 16px;
          z-index: 1000;
          display: none;
          max-width: 320px;
          padding: 12px 36px 12px 14px;
          border-left: 4px solid var(--success-color, #4caf50);
          border-radius: 4px;
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color, #212121);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
        }
        .wud-refresh-success.is-visible {
          display: block;
        }
        .wud-refresh-success-message {
          display: block;
          margin-top: 4px;
          color: var(--secondary-text-color);
          font-size: 13px;
        }
        .wud-refresh-success-close {
          position: absolute;
          top: 8px;
          right: 8px;
          border: 0;
          background: transparent;
          color: inherit;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
        }

        #wud-refresh-btn:hover {
          background: var(--primary-color-dark, #0057b8) !important;
        }
        #wud-refresh-btn.is-hovered {
          background: var(--primary-color-dark, #0057b8) !important;
        }
        
        /* Styled Switch Toggle */
        .wud-toggle-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: var(--primary-text-color);
          user-select: none;
        }
        .wud-switch {
          position: relative;
          display: inline-block;
          width: 36px;
          height: 20px;
        }
        .wud-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .wud-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--disabled-text-color, #ccc);
          transition: 0.2s;
          border-radius: 20px;
        }
        .wud-slider:before {
          position: absolute;
          content: "";
          height: 14px;
          width: 14px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.2s;
          border-radius: 50%;
        }
        .wud-switch input:checked + .wud-slider {
          background-color: var(--primary-color, #03a9f4);
        }
        .wud-switch input:checked + .wud-slider:before {
          transform: translateX(16px);
        }
      </style>
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        margin-top: 8px;
      ">

        <!-- Left side badges -->
        <div style="display: flex; gap: 10px;">

          <!-- Updates badge -->
          <div style="
            border: 2px solid #ff9800;
            background: rgba(255, 152, 0, 0.12);
            color: #ff9800;
            padding: 6px 12px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            gap: 6px;
            font-weight: 600;
            font-size: 13px;
          ">
            <ha-icon icon="mdi:update"></ha-icon>
            ${totalUpdates} update${totalUpdates !== 1 ? "s" : ""}
          </div>

          <!-- Up-to-date badge -->
          <div style="
            border: 2px solid #4caf50;
            background: rgba(76, 175, 80, 0.12);
            color: #4caf50;
            padding: 6px 12px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            gap: 6px;
            font-weight: 600;
            font-size: 13px;
          ">
            <ha-icon icon="mdi:check-circle"></ha-icon>
            ${totalUpToDate} up-to-date
          </div>

        </div>

        <!-- Refresh button -->
        <div id="wud-refresh-btn" style="
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 18px;
          background: var(--primary-color);
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease-in-out;
        "
        >
          <ha-icon id="wud-refresh-icon" icon="mdi:refresh"></ha-icon>
          <span id="wud-refresh-label">Refresh Now</span>
        </div>

      </div>

      <!-- Updates Only Toggle Switch Row -->
      <div style="margin-bottom: 12px; display: flex; justify-content: flex-end;">
        <label class="wud-toggle-wrapper">
          <span>Only show updates</span>
          <span class="wud-switch">
            <input type="checkbox" id="wud-updates-only-toggle" ${isChecked}>
            <span class="wud-slider"></span>
          </span>
        </label>
      </div>
    `;
  }

  _getServerHeading(serverName, collapseState, updateCount, totalCount) {
    return `
      <div class="wud-header" data-watcher="${serverName}" style="
        font-weight: bold;
        margin-top: 16px;
        padding-top: 12px;
        border-top: 1px solid var(--divider-color, #333);
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
      ">
        <div>${serverName.toUpperCase()} ${collapseState ? "▸" : "▾"}</div>
        <div style="color: var(--secondary-text-color); font-size: 13px;">
          ${updateCount > 0
            ? `${updateCount} update${updateCount > 1 ? "s" : ""} available`
            : `${totalCount} up-to-date`}
        </div>
      </div>

      <div class="wud-group" id="group-${serverName}" style="display: ${collapseState ? "none" : "block"};">
    `;
  }

  _getImageLine(icon, hasUpdate, cleanName, versionLine, statusLabel) {
    return `
      <div style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 0;
      ">
        <div style="display: flex; align-items: center; gap: 12px;">
          <ha-icon icon="${icon}" style="color: ${hasUpdate ? 'var(--error-color, red)' : '#2496ED'}; font-size: 24px;"></ha-icon>
          <div style="display: flex; flex-direction: column;">
            <div style="font-size: 15px;">${cleanName}</div>
            <div style="font-size: 12px; color: var(--secondary-text-color);">${versionLine}</div>
          </div>
        </div>

        <div style="text-align: right; font-weight: bold; color: ${hasUpdate ? 'var(--error-color, red)' : 'var(--secondary-text-color)'};">
          ${statusLabel}
        </div>
      </div>
    `;
  }

  _getClosure() {
    return `
      </div>
    `;
  }

  set hass(hass) {
    this._hass = hass;

    if (!this.content) {
      this.innerHTML = `<ha-card header="Docker Containers"><div id="container" style="padding: 0 16px 16px;"></div></ha-card>`;
      this.content = this.querySelector('#container');
    }

    if (this._showOnlyUpdates === undefined) {
      this._showOnlyUpdates = false;
    }

    // Filter all WUD update entities removing any that are unavailable and sort them by watcher and friendly name
    const wudEntries = Object.keys(hass.states)
      .filter(id => id.startsWith('update.wud_'))
      .map((id) => {
        const entity = hass.states[id];
        return { 
          watcher: entity.attributes.watcher || entity.entity_id.split('_')[2] + '<<<', 
          friendlyName: entity.attributes.friendly_name || entity.entity_id,
          installed_version: entity.attributes.installed_version,
          latest_version: entity.attributes.latest_version,
          state: entity.state,
          id: entity.entity_id
        }
      })
      .filter((id) => id.state !== 'unavailable')
      .sort((a, b) => (a.watcher.localeCompare(b.watcher)) || a.friendlyName.localeCompare(b.friendlyName));

    const watcherCounts = wudEntries.reduce((acc, entity) => {
      const w = entity.watcher || "";
      acc[w] = acc[w] || { total: 0, updates: 0 };
      acc[w].total++;
      if (entity.state === "on") acc[w].updates++;
      return acc;
    }, {});

    const totalUpdates = Object.values(watcherCounts).reduce((sum, counts) => sum + counts.updates, 0);
    const totalUpToDate = wudEntries.length - totalUpdates;

    const existingRefreshBtn = this.content.querySelector("#wud-refresh-btn");
    if (existingRefreshBtn) {
      this._refreshHoverState = existingRefreshBtn.matches(":hover");
    }

    // Persist collapse state across hass updates
    this._collapseState = this._collapseState || {};
    const collapseState = this._collapseState;

    // Filter list if toggle is active
    const filteredEntries = wudEntries.filter(entity => {
      if (this._showOnlyUpdates) {
        return entity.state === 'on';
      }
      return true;
    });

    // Generate HTML
    let html = this._getHeading(totalUpdates, totalUpToDate);
    let serverName = '';

    if (filteredEntries.length === 0 && this._showOnlyUpdates) {
      html += `
        <div style="padding: 16px 0; text-align: center; color: var(--secondary-text-color);">
          No pending updates found!
        </div>
      `;
    } else {
      filteredEntries.forEach(entity => {
        if (serverName !== entity.watcher) {
          if (serverName !== '') {
            html += '</div>'; // Close previous group
          }
          serverName = entity.watcher;
          if (collapseState[serverName] === undefined) {
            collapseState[serverName] = false;
          }

          const counts = watcherCounts[serverName];
          const updateCount = counts.updates;
          const totalCount = counts.total;

          html += this._getServerHeading(serverName, collapseState[serverName], updateCount, totalCount);
        }

        const name = entity.friendlyName;
        const cleanName = name.length > 4 ? name.substring(4) : name;
        const installed = entity.installed_version || '?';
        const latest = entity.latest_version || '?';
        const hasUpdate = entity.state === 'on';
        const icon = hasUpdate ? 'mdi:arrow-up-bold-circle-outline' : 'mdi:docker';
        const statusLabel = hasUpdate ? "Update available" : "Up-to-date";
        const versionLine = hasUpdate
          ? `v${installed} → v${latest}`
          : `v${installed}`;
        html += this._getImageLine(icon, hasUpdate, cleanName, versionLine, statusLabel);
      });

      if (serverName !== '') {
        html += this._getClosure();
      }
    }

    this.content.innerHTML = html;

    // Toggle Listener
    const toggleInput = this.content.querySelector("#wud-updates-only-toggle");
    if (toggleInput) {
      toggleInput.addEventListener("change", (e) => {
        this._showOnlyUpdates = e.target.checked;
        this.hass = this._hass; // Trigger re-render with current state
      });
    }

    // Refresh button → call HA service
    const renderedRefreshBtn = this.content.querySelector("#wud-refresh-btn");
    if (existingRefreshBtn) {
      renderedRefreshBtn.replaceWith(existingRefreshBtn);
    }
    const refreshBtn = existingRefreshBtn || renderedRefreshBtn;
    refreshBtn.classList.toggle("is-hovered", this._refreshHoverState === true);
    this._setRefreshLoading(this._refreshLoading === true);

    if (!existingRefreshBtn) {
      refreshBtn.addEventListener("click", async () => {
        if (this._refreshLoading) return;

        this._setRefreshLoading(true);
        try {
          await this._hass.callService(MultiHostWudCard.REST_SERVICE, MultiHostWudCard.WUD_REFRESH, {});
          this._showRefreshSuccess();
        } catch (error) {
          this._showRefreshError(error);
        } finally {
          this._setRefreshLoading(false);
        }
      });
      refreshBtn.addEventListener("mouseenter", () => {
        this._refreshHoverState = true;
        refreshBtn.classList.add("is-hovered");
      });
      refreshBtn.addEventListener("mouseleave", () => {
        this._refreshHoverState = false;
        refreshBtn.classList.remove("is-hovered");
      });
    }

    // Add collapse behavior
    this.querySelectorAll(".wud-header").forEach(header => {
      header.addEventListener("click", () => {
        const watcher = header.dataset.watcher;
        const group = this.querySelector(`#group-${watcher}`);

        collapseState[watcher] = !collapseState[watcher];

        group.style.display = collapseState[watcher] ? "none" : "block";

        header.querySelector("div").innerHTML =
          `${watcher.toUpperCase()} ${collapseState[watcher] ? "▸" : "▾"}`;
      });
    });
  }
}

customElements.define('multihost-wud-card', MultiHostWudCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'multihost-wud-card',
  name: 'Multi-Host WUD Card',
  description: 'A card to display updates for multiple Docker hosts using WUD.'
});

console.info('%c MARKRAD-WUD-CARD %c v1.0.1 ', 'color: white; background: #03a9f4; font-weight: bold;', 'color: #03a9f4; background: white; font-weight: bold;');