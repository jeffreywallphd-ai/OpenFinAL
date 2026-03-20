// No Warranty
// This software is provided "as is" without any warranty of any kind, express or implied. This includes, but is not limited to, the warranties of merchantability, fitness for a particular purpose, and non-infringement.
//
// Disclaimer of Liability
// The authors of this software disclaim all liability for any damages, including incidental, consequential, special, or indirect damages, arising from the use or inability to use this software.

import React, { useContext, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { useHeader } from './App/LoadedLayout';
import { DataContext } from './App';
import { AdaptiveLearningRecommendations, useAdaptiveLearningCatalogRecommendations } from '@ui/adaptive';

export function Learn() {
  const { setHeader } = useHeader();
  const { user } = useContext(DataContext);
  const location = useLocation();
  const [state, setState] = useState({
    modules: null,
    isLoading: true,
    searching: false,
  });
  const searchRef = useRef('SearchTextField');
  const filterRef = useRef('FilterSelect');
  const { adaptiveLearningCatalog, adaptiveLearningLoading } = useAdaptiveLearningCatalogRecommendations(user?.id);

  useEffect(() => {
    setHeader({
      title: 'Learning Modules',
      icon: 'school',
    });
  }, [setHeader]);

  useEffect(() => {
    selectData();
  }, []);

  const checkInput = async (event) => {
    if (event.key === 'Enter') {
      await selectData();
    }
  };

  const selectData = async () => {
    try {
      setState((current) => ({
        modules: current.modules,
        isLoading: current.isLoading,
        searching: true,
      }));

      const inputData = [];
      let query = 'SELECT * FROM LearningModule';

      if (searchRef.current.value !== '') {
        query += " WHERE keywords LIKE '%' || ? || '%'";
        inputData.push(searchRef.current.value);
      }

      if (filterRef.current.value !== '' && searchRef.current.value !== '') {
        query += ' AND category=?';
        inputData.push(filterRef.current.value);
      } else if (filterRef.current.value !== '') {
        query += ' WHERE category=?';
        inputData.push(filterRef.current.value);
      }

      query += ' ORDER BY dateCreated DESC, title ASC';
      query += ' LIMIT ?';
      inputData.push(25);

      const data = await window.database.SQLiteSelectData({ query, inputData });
      setState({
        modules: data,
        isLoading: false,
        searching: false,
      });
    } catch (error) {
      console.error(`Error fetching data:${error}`);
      setState((current) => ({
        modules: current.modules,
        isLoading: false,
        searching: false,
      }));
    }
  };

  window.console.log(window.electronApp.getAssetPath());
  window.console.log(location.pathname);

  return (
    <div className="page">
      <AdaptiveLearningRecommendations viewModel={adaptiveLearningCatalog} loading={adaptiveLearningLoading} />

      <form
        className="learning-modules-search-form"
        onSubmit={async (event) => {
          event.preventDefault();
          await selectData();
        }}
      >
        <div>
          <input
            className="priceSearchBar"
            type="text"
            ref={searchRef}
            onKeyUp={(event) => checkInput(event)}
            placeholder="Please enter a topic to learn about"
          />
          <button className="priceSearchButton" type="submit" disabled={state.searching}><FaSearch /></button>
        </div>
        <div>&nbsp;</div>
        <div>
          <span>Filter by: </span>
          <select ref={filterRef} onChange={selectData}>
            <option value="">Select a Category...</option>
            <option value="Stock">Stocks</option>
            <option value="Index">Index Funds</option>
            <option value="Bond">Bonds</option>
            <option value="Tax">Taxes</option>
            <option value="RiskAnalysis">Risk Analysis</option>
            <option value="MLAI">Machine Learning and AI</option>
          </select>
        </div>
      </form>

      <section className="learning-modules-list">
        {state.modules ? (
          state.modules.map((module, index) => (
            <article key={index} className="learning-modules-list__card">
              <h3>{module.title}</h3>
              <p>Description: {module.description}</p>
              <p>Estimated Time: {module.timeEstimate} minutes</p>
              <NavLink
                to="/learningModule"
                state={{
                  moduleId: module.id,
                  title: module.title,
                  description: module.description,
                  timeEstimate: module.timeEstimate,
                  dateCreated: module.dateCreated,
                  fileName: module.fileName,
                  pages: null,
                }}
              >
                View Module
              </NavLink>
            </article>
          ))
        ) : state.isLoading === true ? (
          <div>Loading...</div>
        ) : (
          <div>Error: Unable to load the learning modules</div>
        )}
      </section>
    </div>
  );
}
