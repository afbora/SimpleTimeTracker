// Saves options to chrome.storage
const saveOptions = () => {
  const dynamic_tasks = document.getElementById('dynamic_tasks').checked;
  const sort_by = document.getElementById('sort_by').value ?? 'id';
  const sort_direction = document.getElementById('sort_direction').value ?? 'asc';

  chrome.storage.local.set(
    {
      dynamic_tasks: dynamic_tasks,
      sort_by: sort_by,
      sort_direction: sort_direction
    },
    () => {
      // Update status to let user know options were saved.
      const status = document.getElementById('status');
      status.textContent = 'Options saved.';
      setTimeout(() => {
        status.textContent = '';
      }, 2000);
    }
  );
};

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
const restoreOptions = () => {
  chrome.storage.local.get(
    {
      dynamic_tasks: false,
      sort_by: 'id',
      sort_direction: 'asc'
    },
    (items) => {
      document.getElementById('dynamic_tasks').checked = items.dynamic_tasks;
      document.getElementById('sort_by').value = items.sort_by;
      document.getElementById('sort_direction').value = items.sort_direction;
    }
  );
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
