/**
 * Test Template Sync v0.3.0
 *
 * Uses InvenTree's imperative plugin-panel interface:
 *   renderFunction(targetElement, pluginContext)
 *
 * No bundled frontend dependencies are required.
 */

function element(tag, options = {}, children = []) {
  const node = document.createElement(tag);

  if (options.className) {
    node.className = options.className;
  }

  if (options.text !== undefined) {
    node.textContent = options.text;
  }

  if (options.type) {
    node.type = options.type;
  }

  if (options.placeholder) {
    node.placeholder = options.placeholder;
  }

  if (options.disabled !== undefined) {
    node.disabled = options.disabled;
  }

  if (options.value !== undefined) {
    node.value = options.value;
  }

  if (options.style) {
    Object.assign(node.style, options.style);
  }

  for (const child of children) {
    if (child) {
      node.appendChild(child);
    }
  }

  return node;
}

function clear(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

function partLabel(part) {
  const ipn = part.IPN || part.ipn || "";
  return ipn ? `${part.name} (${ipn}) - ID ${part.pk}` : `${part.name} - ID ${part.pk}`;
}

function resultItems(items) {
  return (items || []).map((item) => item.test_name || item.key || "Unknown");
}

function resultSection(title, items, note = "") {
  const box = element("div", {
    style: {
      border: "1px solid var(--mantine-color-default-border, #ced4da)",
      borderRadius: "6px",
      padding: "10px",
      marginTop: "8px"
    }
  });

  box.appendChild(
    element("div", {
      text: `${title} (${(items || []).length})`,
      style: { fontWeight: "600", marginBottom: "4px" }
    })
  );

  if (note) {
    box.appendChild(
      element("div", {
        text: note,
        style: { fontSize: "0.85rem", opacity: "0.75", marginBottom: "4px" }
      })
    );
  }

  if (!items || items.length === 0) {
    box.appendChild(element("div", { text: "None", style: { opacity: "0.65" } }));
    return box;
  }

  const list = element("ul", { style: { margin: "4px 0 0 18px", padding: "0" } });

  for (const name of resultItems(items)) {
    list.appendChild(element("li", { text: name }));
  }

  box.appendChild(list);
  return box;
}

function getErrorMessage(error) {
  const data = error?.response?.data;

  if (typeof data === "string") {
    return data;
  }

  if (data) {
    try {
      return JSON.stringify(data);
    } catch (_) {
      return "The server returned an error.";
    }
  }

  return error?.message || "Unknown error";
}

async function callSync(api, sourcePart, targetPart, dryRun) {
  const response = await api.post("/api/action/", {
    action: "sync_test_templates",
    data: {
      source_part: sourcePart,
      target_part: targetPart,
      dry_run: dryRun,
      disable_stale: true
    }
  });

  return response.data?.result || response.data;
}

export function renderTestTemplateSyncPanel(target, data) {
  if (!target) {
    console.error("Test Template Sync: no target element was provided");
    return;
  }

  clear(target);

  const api = data?.api;
  const targetPart = Number(data?.context?.target_part ?? data?.id);
  const targetName =
    data?.context?.target_name ||
    data?.instance?.name ||
    `Part ${targetPart}`;

  if (!api || !targetPart) {
    target.appendChild(
      element("div", {
        text: "Test Template Sync could not determine the current Part or API context."
      })
    );
    return;
  }

  let selectedSource = null;
  let previewResult = null;

  const root = element("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      maxWidth: "900px"
    }
  });

  root.appendChild(
    element("div", {
      text:
        "Copy the effective Test Templates from another Part to this Part. " +
        "Tests removed or renamed at the source are disabled on the target, not deleted, so historical results are preserved.",
      style: { lineHeight: "1.45" }
    })
  );

  const targetBox = element("div", {
    style: {
      padding: "8px 10px",
      borderRadius: "6px",
      background: "var(--mantine-color-default-hover, rgba(0,0,0,0.04))"
    }
  });

  targetBox.appendChild(
    element("strong", { text: "Target Part: " })
  );
  targetBox.appendChild(
    element("span", { text: `${targetName} (ID ${targetPart})` })
  );
  root.appendChild(targetBox);

  const searchRow = element("div", {
    style: { display: "flex", gap: "8px", alignItems: "flex-end", flexWrap: "wrap" }
  });

  const searchWrap = element("div", {
    style: { flex: "1 1 320px" }
  });

  searchWrap.appendChild(
    element("label", {
      text: "Search source Part",
      style: { display: "block", fontWeight: "600", marginBottom: "4px" }
    })
  );

  const searchInput = element("input", {
    type: "text",
    placeholder: "Enter Part name, IPN, or search text",
    style: {
      width: "100%",
      boxSizing: "border-box",
      padding: "8px 10px",
      border: "1px solid #adb5bd",
      borderRadius: "5px",
      background: "var(--mantine-color-body, white)",
      color: "inherit"
    }
  });

  searchWrap.appendChild(searchInput);

  const searchButton = element("button", {
    type: "button",
    text: "Search",
    style: {
      padding: "8px 14px",
      cursor: "pointer",
      borderRadius: "5px",
      border: "1px solid #868e96"
    }
  });

  searchRow.appendChild(searchWrap);
  searchRow.appendChild(searchButton);
  root.appendChild(searchRow);

  const selectWrap = element("div");
  selectWrap.appendChild(
    element("label", {
      text: "Source Part",
      style: { display: "block", fontWeight: "600", marginBottom: "4px" }
    })
  );

  const sourceSelect = element("select", {
    disabled: true,
    style: {
      width: "100%",
      padding: "8px 10px",
      border: "1px solid #adb5bd",
      borderRadius: "5px",
      background: "var(--mantine-color-body, white)",
      color: "inherit"
    }
  });

  sourceSelect.appendChild(element("option", { text: "Search for a Part first", value: "" }));
  selectWrap.appendChild(sourceSelect);
  root.appendChild(selectWrap);

  const status = element("div", {
    style: { minHeight: "20px", fontSize: "0.9rem" }
  });
  root.appendChild(status);

  const actions = element("div", {
    style: { display: "flex", gap: "8px", flexWrap: "wrap" }
  });

  const previewButton = element("button", {
    type: "button",
    text: "Preview Sync",
    disabled: true,
    style: {
      padding: "8px 14px",
      cursor: "pointer",
      borderRadius: "5px",
      border: "1px solid #228be6"
    }
  });

  const syncButton = element("button", {
    type: "button",
    text: "Synchronize Test Templates",
    disabled: true,
    style: {
      padding: "8px 14px",
      cursor: "pointer",
      borderRadius: "5px",
      border: "1px solid #2f9e44",
      fontWeight: "600"
    }
  });

  actions.appendChild(previewButton);
  actions.appendChild(syncButton);
  root.appendChild(actions);

  const resultContainer = element("div");
  root.appendChild(resultContainer);

  function setStatus(message, isError = false) {
    status.textContent = message || "";
    status.style.color = isError ? "#e03131" : "";
  }

  function renderPreview(result, final = false) {
    clear(resultContainer);

    const header = element("div", {
      text: final ? "Synchronization complete" : "Synchronization preview",
      style: { fontWeight: "700", marginTop: "4px", fontSize: "1rem" }
    });
    resultContainer.appendChild(header);

    if (final) {
      resultContainer.appendChild(resultSection("Created", result.created));
      resultContainer.appendChild(resultSection("Updated", result.updated));
      resultContainer.appendChild(
        resultSection(
          "Disabled",
          result.disabled,
          "Disabled templates are retained so historical test results remain available."
        )
      );
    } else {
      resultContainer.appendChild(resultSection("Create", result.would_create));
      resultContainer.appendChild(resultSection("Update", result.would_update));
      resultContainer.appendChild(
        resultSection(
          "Disable",
          result.would_disable,
          "These templates will be disabled, not deleted."
        )
      );
    }

    resultContainer.appendChild(resultSection("Unchanged", result.unchanged));

    const targetOnlyDisabled = (result.target_only || []).filter((item) => !item.enabled);
    if (targetOnlyDisabled.length > 0) {
      resultContainer.appendChild(
        resultSection(
          "Historical / already disabled",
          targetOnlyDisabled,
          "These are retained and will not be re-enabled."
        )
      );
    }
  }

  async function searchParts() {
    const query = searchInput.value.trim();

    if (!query) {
      setStatus("Enter a Part name, IPN, or search term.", true);
      return;
    }

    searchButton.disabled = true;
    sourceSelect.disabled = true;
    previewButton.disabled = true;
    syncButton.disabled = true;
    selectedSource = null;
    previewResult = null;
    clear(resultContainer);
    setStatus("Searching Parts...");

    try {
      const response = await api.get("/api/part/", {
        params: {
          search: query,
          limit: 50
        }
      });

      const payload = response.data;
      const parts = Array.isArray(payload) ? payload : (payload?.results || []);

      clear(sourceSelect);
      sourceSelect.appendChild(
        element("option", { text: "Select a source Part", value: "" })
      );

      for (const part of parts) {
        if (Number(part.pk) === targetPart) {
          continue;
        }

        const option = element("option", {
          text: partLabel(part),
          value: String(part.pk)
        });
        option.dataset.partName = part.name || "";
        sourceSelect.appendChild(option);
      }

      if (sourceSelect.options.length <= 1) {
        sourceSelect.disabled = true;
        setStatus("No matching source Parts were found.", true);
      } else {
        sourceSelect.disabled = false;
        setStatus(`${sourceSelect.options.length - 1} matching Part(s) found.`);
      }
    } catch (error) {
      setStatus(`Part search failed: ${getErrorMessage(error)}`, true);
    } finally {
      searchButton.disabled = false;
    }
  }

  sourceSelect.addEventListener("change", () => {
    const value = sourceSelect.value;
    previewResult = null;
    clear(resultContainer);
    syncButton.disabled = true;

    if (!value) {
      selectedSource = null;
      previewButton.disabled = true;
      setStatus("Select a source Part.");
      return;
    }

    selectedSource = Number(value);
    previewButton.disabled = false;
    setStatus("Source Part selected. Preview the synchronization before applying it.");
  });

  searchButton.addEventListener("click", searchParts);

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      searchParts();
    }
  });

  previewButton.addEventListener("click", async () => {
    if (!selectedSource) {
      return;
    }

    previewButton.disabled = true;
    syncButton.disabled = true;
    clear(resultContainer);
    setStatus("Generating synchronization preview...");

    try {
      previewResult = await callSync(api, selectedSource, targetPart, true);
      renderPreview(previewResult, false);
      syncButton.disabled = false;
      setStatus(
        `Preview ready. Source: ${previewResult.source_part.name}; Target: ${previewResult.target_part.name}.`
      );
    } catch (error) {
      setStatus(`Preview failed: ${getErrorMessage(error)}`, true);
    } finally {
      previewButton.disabled = false;
    }
  });

  syncButton.addEventListener("click", async () => {
    if (!selectedSource || !previewResult) {
      return;
    }

    const sourceName = previewResult.source_part?.name || `Part ${selectedSource}`;

    const confirmed = window.confirm(
      `Synchronize Test Templates from "${sourceName}" to "${targetName}"?\n\n` +
      "Templates no longer present at the source will be disabled, not deleted."
    );

    if (!confirmed) {
      return;
    }

    searchButton.disabled = true;
    sourceSelect.disabled = true;
    previewButton.disabled = true;
    syncButton.disabled = true;
    setStatus("Synchronizing Test Templates...");

    try {
      const result = await callSync(api, selectedSource, targetPart, false);
      renderPreview(result, true);
      previewResult = null;
      setStatus(
        `Synchronization complete: ${result.created.length} created, ` +
        `${result.updated.length} updated, ${result.disabled.length} disabled.`
      );

      if (typeof data.reloadContent === "function") {
        data.reloadContent();
      }

      if (typeof data.reloadInstance === "function") {
        data.reloadInstance();
      }
    } catch (error) {
      setStatus(`Synchronization failed: ${getErrorMessage(error)}`, true);
      syncButton.disabled = false;
    } finally {
      searchButton.disabled = false;
      sourceSelect.disabled = false;
      previewButton.disabled = false;
    }
  });

  target.appendChild(root);
}
