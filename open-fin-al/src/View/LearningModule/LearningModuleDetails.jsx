// No Warranty
// This software is provided "as is" without any warranty of any kind, express or implied. This includes, but is not limited to, the warranties of merchantability, fitness for a particular purpose, and non-infringement.
//
// Disclaimer of Liability
// The authors of this software disclaim all liability for any damages, including incidental, consequential, special, or indirect damages, arising from the use or inability to use this software.

import React, { useState, useEffect } from "react";
import {
    NavLink,
    useLocation,
    useNavigate 
} from "react-router-dom";

export function LearningModuleDetails(props) {
    const location = useLocation();
    const navigate = useNavigate();
    const adaptiveModuleCard = location.state?.adaptiveModuleCard;

    const [state, setState] = useState({
        pages: null,
        isLoading: true
    });

    useEffect(() => {
        selectPageData();
    }, []);

    const selectPageData = async () => {
        try {            
            // TODO: move this query building to a Gateway implementation for SQLite
            // so that it can easily be configured with other databases later
            const inputData = [];
            var query = "SELECT * FROM LearningModulePage WHERE moduleId=? ORDER BY pageNumber ASC";
            
            inputData.push(location.state.moduleId);
            await window.database.SQLiteSelectData({ query, inputData }).then((data) => {
                setState({
                    pages: data,
                    isLoading: false
                  });
            });
        } catch (error) {
            console.error('Error fetching data:' + error);
        }
    };

    const handleStartModule = async () => {
        try {
            // get base asset path from Electron (async)
            const assetPath = await window.electronApp.getAssetPath();

            // TODO: handle different OS path separators
            const filePath = `${assetPath}\\${location.state.fileName}`;

            // navigate to the learningModulePage route with the full path
            navigate("/learningModulePage", {
                state: {
                    fileName: filePath,
                    moduleId: location.state.moduleId
                },
            });
        } catch (err) {
            console.error("Error starting module:", err);
        }
    };

    return (
        <div className="page">
            <div>
                <h3>{location.state.title}</h3>
                <p>Description: {location.state.description}</p>
                <p>Estimated Time: {location.state.timeEstimate} minutes</p>
                {adaptiveModuleCard?.metadataTitle ? (
                    <p>Adaptive metadata: {adaptiveModuleCard.metadataTitle}</p>
                ) : (
                    <p>Adaptive metadata: pending first-class metadata authoring for this module.</p>
                )}
                {adaptiveModuleCard?.contentSource ? (
                    <p>Delivery pipeline: <strong>{adaptiveModuleCard.contentSource.label}</strong> — {adaptiveModuleCard.contentSource.summary}</p>
                ) : null}
                {adaptiveModuleCard?.prerequisites?.length ? (
                    <div className="adaptive-learning-recommendation-card__section">
                        <h4>Prerequisites</h4>
                        <ul>
                            {adaptiveModuleCard.prerequisites.map((prerequisite) => (
                                <li key={prerequisite.label}>
                                    <strong>{prerequisite.satisfied ? "Ready" : "Next up"}</strong>: {prerequisite.label}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}
                {adaptiveModuleCard?.relatedFeatures?.length ? (
                    <div className="adaptive-learning-recommendation-card__section">
                        <h4>Related features/tools</h4>
                        <ul>
                            {adaptiveModuleCard.relatedFeatures.map((feature) => (
                                <li key={feature.assetId}>
                                    <strong>{feature.title}</strong>{feature.availabilityState ? ` (${feature.availabilityState})` : ""}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}
                {adaptiveModuleCard?.unlockOpportunities?.length ? (
                    <div className="adaptive-learning-recommendation-card__section">
                        <h4>Unlock opportunities</h4>
                        <ul>
                            {adaptiveModuleCard.unlockOpportunities.map((opportunity) => (
                                <li key={`${opportunity.assetId || opportunity.title}-${opportunity.reason}`}>
                                    <strong>{opportunity.title}</strong>: {opportunity.reason}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}
                {adaptiveModuleCard?.tutorials?.length || adaptiveModuleCard?.helpHints?.length ? (
                    <div className="adaptive-learning-recommendation-card__section">
                        <h4>Tutorials and hints</h4>
                        <ul>
                            {adaptiveModuleCard?.tutorials?.map((tutorial) => <li key={tutorial.assetId}>Tutorial: {tutorial.title}</li>)}
                            {adaptiveModuleCard?.helpHints?.map((hint) => <li key={hint.assetId}>Hint: {hint.title}</li>)}
                        </ul>
                    </div>
                ) : null}
            </div>
                {
                    state.isLoading ? 
                    (<div>Loading...</div>) :
                    (
                        <div>
                            <button onClick={handleStartModule}>
                                Start Module
                            </button>
                        </div>
                    )
                }
        </div>
    );
}
