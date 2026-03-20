// No Warranty
// This software is provided "as is" without any warranty of any kind, express or implied. This includes, but is not limited to, the warranties of merchantability, fitness for a particular purpose, and non-infringement.
//
// Disclaimer of Liability
// The authors of this software disclaim all liability for any damages, including incidental, consequential, special, or indirect damages, arising from the use or inability to use this software.

import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { useHeader } from './App/LoadedLayout';
import { DataContext } from './App';
import { AdaptiveGuidedTutorial, AdaptiveHelpHintPanel, AdaptiveLearningRecommendations, useAdaptiveLearningCatalogRecommendations } from '@ui/adaptive';
import { GuidedTutorialInteractor } from '../Interactor/GuidedTutorialInteractor';
import { buildAdaptiveLearningModuleCards } from '@application/adaptive-learning/learningModuleArea';

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
  const guidedTutorialInteractor = useMemo(() => new GuidedTutorialInteractor(), []);
  const [tutorialSaving, setTutorialSaving] = useState(false);
  const adaptiveModuleCards = useMemo(
    () => (
      state.modules
        ? buildAdaptiveLearningModuleCards(state.modules, {
            profile: adaptiveLearningCatalog?.learnerProfile,
            graphRecommendations: adaptiveLearningCatalog?.graphRecommendations ?? [],
            recommendationResult: adaptiveLearningCatalog?.recommendationResult,
          })
        : []
    ),
    [adaptiveLearningCatalog, state.modules],
  );

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

  const handleTutorialComplete = async (runtime) => {
    if (!user?.id) {
      return;
    }

    try {
      setTutorialSaving(true);
      await guidedTutorialInteractor.completeLearningCatalogTutorial(user.id, runtime.tutorial.id);
    } catch (error) {
      console.error(`Error saving tutorial completion:${error}`);
    } finally {
      setTutorialSaving(false);
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
      <AdaptiveGuidedTutorial
        runtime={adaptiveLearningCatalog?.guidedTutorial}
        loading={tutorialSaving}
        onComplete={handleTutorialComplete}
      />
      <AdaptiveHelpHintPanel hint={adaptiveLearningCatalog?.contextualHelpHint} loading={adaptiveLearningLoading} />

      <form
        className="learning-modules-search-form"
        onSubmit={async (event) => {
          event.preventDefault();
          await selectData();
        }}
      >
        <div>
          <input
            data-guided-tutorial-anchor="learning-modules-search-input"
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
          <select ref={filterRef} onChange={selectData} data-guided-tutorial-anchor="learning-modules-filter-select">
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

      <section className="learning-modules-list" data-guided-tutorial-anchor="learning-modules-results">
        {state.modules ? (
          adaptiveModuleCards.map((module) => (
            <article key={module.moduleId} className="learning-modules-list__card">
              <div className="adaptive-learning-recommendation-card__header">
                <div>
                  <p className="adaptive-feature-section__eyebrow">
                    {module.recommended ? 'Recommended module' : 'Learning module'}
                  </p>
                  <h3>{module.title}</h3>
                </div>
                {module.recommendationScore ? <span className="adaptive-feature-section__pill">Score {module.recommendationScore}</span> : null}
              </div>
              <p>Description: {module.description}</p>
              <p>Estimated Time: {module.timeEstimate} minutes</p>
              <p>
                Delivery: <strong>{module.contentSource.label}</strong> — {module.contentSource.summary}
              </p>
              {module.metadataTitle ? (
                <p>
                  Adaptive metadata: <strong>{module.metadataTitle}</strong>
                </p>
              ) : (
                <p>Adaptive metadata: pending first-class authoring metadata for this legacy module.</p>
              )}
              {module.prerequisites.length ? (
                <div className="adaptive-learning-recommendation-card__section">
                  <h4>Prerequisites</h4>
                  <ul>
                    {module.prerequisites.map((prerequisite) => (
                      <li key={prerequisite.label}>
                        <strong>{prerequisite.satisfied ? 'Ready' : 'Next up'}</strong>: {prerequisite.label}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {module.relatedFeatures.length ? (
                <div className="adaptive-learning-recommendation-card__section">
                  <h4>Related features/tools</h4>
                  <ul>
                    {module.relatedFeatures.map((feature) => (
                      <li key={feature.assetId}>
                        <strong>{feature.title}</strong>
                        {feature.availabilityState ? ` (${feature.availabilityState})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {module.unlockOpportunities.length ? (
                <div className="adaptive-learning-recommendation-card__section">
                  <h4>Unlock opportunities</h4>
                  <ul>
                    {module.unlockOpportunities.map((opportunity) => (
                      <li key={`${opportunity.assetId ?? opportunity.title}-${opportunity.reason}`}>
                        <strong>{opportunity.title}</strong>: {opportunity.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {module.tutorials.length || module.helpHints.length ? (
                <div className="adaptive-learning-recommendation-card__section">
                  <h4>Tutorials and hints</h4>
                  <ul>
                    {module.tutorials.map((tutorial) => <li key={tutorial.assetId}>Tutorial: {tutorial.title}</li>)}
                    {module.helpHints.map((hint) => <li key={hint.assetId}>Hint: {hint.title}</li>)}
                  </ul>
                </div>
              ) : null}
              <NavLink
                to="/learningModule"
                state={{
                  moduleId: module.moduleId,
                  title: module.title,
                  description: module.description,
                  timeEstimate: module.timeEstimate,
                  dateCreated: state.modules.find((entry) => entry.id === module.moduleId)?.dateCreated,
                  fileName: module.fileName,
                  pages: null,
                  adaptiveModuleCard: module,
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
