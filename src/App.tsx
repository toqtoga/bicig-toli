import { useCallback, useMemo, useState, type ChangeEvent } from "react";
import "./App.scss";
import data from "./data/data.json";
import { debounce, fuzzySearchTolgoiUg, sorter, toLatin } from "./utils";
import type { Data } from "./types";

const NormalizationInfo = () => {
  return (
    <div className="normalization-info">
      <h3>Нормчлолын дүрэм</h3>
      <ul>
        <li>
          <strong>Эгшиг:</strong> ᠤ (u) → o, ᠦ (ü) → ö
        </li>
        <li>
          <strong>Гийгүүлэгч:</strong> ᠲ (t) → d, ᠳ (d) → d
        </li>
        <li>
          <strong>Эхний ᠬᠡ (qe/ge):</strong> → he
        </li>
        <li>
          <strong>Дундах ᠬᠡ (qe/ge):</strong> → he
        </li>
      </ul>
      <p className="note">
        Латин үсгээр хайхдаа эдгээр дүрмийг ашиглан монгол бичгээс хайна.
      </p>
    </div>
  );
};

function App() {
  const [searchTerm, setSearchTerm] = useState("тамир");
  const [isLoading, setIsLoading] = useState(false);

  const sort = useCallback((searchValue: string) => sorter(searchValue), []);

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string, setResults: (results: Data) => void) => {
        const searched = (data as Data)
          .filter(fuzzySearchTolgoiUg(value))
          .sort(sort(value)) // Pass value to sort
          .slice(0, 20);
        setResults(searched);
        setIsLoading(false);
      }, 500),
    [sort],
  );

  const [results, setResults] = useState<Data>(() => {
    return (data as Data)
      .filter(fuzzySearchTolgoiUg(searchTerm))
      .sort(sort(searchTerm)) // Pass searchTerm to sort
      .slice(0, 20);
  });

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value.toLowerCase();
    setSearchTerm(value);
    setIsLoading(true);
    debouncedSearch(value, setResults);
  };

  return (
    <>
      <NormalizationInfo />
      <input type="text" defaultValue={searchTerm} onChange={handleSearch} />
      <div className="results-list">
        {isLoading ? (
          <div>Хайж байна...</div>
        ) : (
          results.map((r) => {
            return (
              <li key={r.tolgoi_ug}>
                <span className="top-row">
                  <span className="cyr">{r.tolgoi_ug}</span>
                  <span className="mon">{r.tolgoi_ug_hudam}</span>
                </span>
                <span className="monlat">
                  {toLatin(r.tolgoi_ug_hudam)} <br /> {"( "}
                  {toLatin(r.tolgoi_ug_hudam, false)}
                  {")"}
                </span>
              </li>
            );
          })
        )}
      </div>
    </>
  );
}

export default App;
