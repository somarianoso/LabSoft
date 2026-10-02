const ratingFilters = [
  { value: 4.5, label: "★★★★★ 4,5+" },
  { value: 4, label: "★★★★☆ 4,0+" },
  { value: 3, label: "★★★☆☆ 3,0+" },
];

export default function ExploreFilters({
  categories,
  selectedCategories,
  onCategoryChange,
  selectedRatings,
  onRatingChange,
  onClear,
}) {
  return (
    <aside className="filters">
      <strong>Filtros</strong>
      <button type="button" onClick={onClear}>
        Limpar
      </button>
      <h5>Categoria</h5>
      <label>
        <input
          type="checkbox"
          name="category"
          value="Todos"
          checked={selectedCategories.size === 0}
          onChange={() => onCategoryChange("Todos")}
        />{" "}
        Todos
      </label>
      {categories.map((name) => (
        <label key={name}>
          <input
            type="checkbox"
            name="category"
            value={name}
            checked={selectedCategories.has(name)}
            onChange={() => onCategoryChange(name)}
          />{" "}
          {name}
        </label>
      ))}
      <h5>Avaliação</h5>
      {ratingFilters.map(({ value, label }) => (
        <label key={value}>
          <input
            type="checkbox"
            name="rating"
            value={value}
            checked={selectedRatings.has(value)}
            onChange={() => onRatingChange(value)}
          />{" "}
          {label}
        </label>
      ))}
    </aside>
  );
}
