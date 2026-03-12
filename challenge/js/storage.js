const FILTER_STORAGE_KEY = "expenseTrackerFilters";
const FORM_DRAFT_KEY = "expenseTrackerFormDraft";
const THEME_STORAGE_KEY = "expenseTrackerTheme";

export function saveFilterSettings(settings) {
  localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(settings));
}

export function getFilterSettings() {
  const saved = localStorage.getItem(FILTER_STORAGE_KEY);
  return saved ? JSON.parse(saved) : null;
}

export function saveFormDraft(draft) {
  sessionStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(draft));
}

export function getFormDraft() {
  const saved = sessionStorage.getItem(FORM_DRAFT_KEY);
  return saved ? JSON.parse(saved) : null;
}

export function clearFormDraft() {
  sessionStorage.removeItem(FORM_DRAFT_KEY);
}

export function saveTheme(theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function getTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) || "light";
}
