type RecommendationSelectionOption = {
  id: string;
  title: string;
};

export function recommendationSelectionUpdate(
  currentId: string,
  requestedId: string,
  options: readonly RecommendationSelectionOption[]
) {
  if (requestedId === currentId) return null;
  const next = options.find((option) => option.id === requestedId);
  if (!next) return null;

  return {
    id: next.id,
    announcement: `Details updated for ${next.title}.`
  };
}
