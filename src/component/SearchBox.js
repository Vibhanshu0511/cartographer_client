import React, { useState } from 'react';
import "./searchBoxCSS.css"

const SearchBox = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
    setQuery('');
  };

  return (
    

    <form onSubmit={handleSubmit}>
    <div class="search">
                          <input type="text" class="form-control" value={query}
        onChange={handleChange}
        placeholder="Search for a ship or port..." />
                          <button type='submit' class="btn btn-primary">Search</button>
                        </div>
    </form>
  );
};

export default SearchBox;
