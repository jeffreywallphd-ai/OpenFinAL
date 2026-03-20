import React, { useContext, useEffect, useMemo, useState } from 'react';
import { DataContext } from '../App';
import { HeaderContext } from '../App/LoadedLayout';
import { LearnerProfileInteractor } from '../../Interactor/LearnerProfileInteractor';
import {
  EXPERIENCE_MARKERS,
  INTERESTED_TAGS,
  INVESTMENT_GOALS,
  KNOWLEDGE_LEVELS,
  RISK_PREFERENCES,
  createSurveyInputFromProfile,
} from '@application/adaptive-learning/learnerProfile';

const KNOWLEDGE_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

const GOAL_LABELS = {
  'capital-preservation': 'Capital preservation',
  income: 'Income',
  growth: 'Growth',
  retirement: 'Retirement',
  'education-savings': 'Education savings',
  diversification: 'Diversification',
  speculation: 'Speculation',
};

const RISK_LABELS = {
  'very-conservative': 'Very conservative',
  conservative: 'Conservative',
  moderate: 'Moderate',
  aggressive: 'Aggressive',
  speculative: 'Speculative',
};

const EXPERIENCE_LABELS = {
  'opened-investment-account': 'I have opened an investment account.',
  'owns-investments': 'I currently own investments.',
  'completed-learning-module': 'I have completed an investing lesson or module.',
  'placed-practice-trade': 'I have placed a practice or paper trade.',
  'uses-financial-news': 'I follow markets or financial news regularly.',
  'tracks-a-budget': 'I track a budget or savings plan.',
};

const TAG_LABELS = {
  stocks: 'Stocks',
  income: 'Income investing',
  retirement: 'Retirement planning',
  portfolio: 'Portfolio building',
  'risk-management': 'Risk management',
  research: 'Research workflows',
  'guided-tutorials': 'Guided tutorials',
};

const MODULE_OPTIONS = [0, 1, 3, 5, 10];
const TRADE_OPTIONS = [0, 1, 3, 5, 10];

const initialFormState = {
  knowledgeLevel: '',
  investmentGoals: [],
  riskPreference: '',
  confidenceScore: null,
  selfAssessment: '',
  interestedTags: [],
  experienceMarkers: [],
  learningModulesCompleted: 0,
  practiceTradesCompleted: 0,
};

function toggleSelection(values, value) {
  return values.includes(value)
    ? values.filter((candidate) => candidate !== value)
    : [...values, value];
}

export function LearnerProfilePage() {
  const { user } = useContext(DataContext);
  const { setHeader } = useContext(HeaderContext);
  const interactor = useMemo(() => new LearnerProfileInteractor(), []);
  const [formState, setFormState] = useState(initialFormState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const [message, setMessage] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');

  useEffect(() => {
    setHeader({ title: 'Learner Profile', icon: 'assignment' });
  }, [setHeader]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) {
        return;
      }

      setLoading(true);
      setErrors([]);

      try {
        const profile = await interactor.loadProfile(user.id);
        setFormState(createSurveyInputFromProfile(profile));
        setUpdatedAt(profile.updatedAt ?? '');
      } catch (_error) {
        setErrors(['Unable to load the learner profile right now.']);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [interactor, user]);

  const handleCheckboxToggle = (fieldName, value) => {
    setFormState((current) => ({
      ...current,
      [fieldName]: toggleSelection(current[fieldName], value),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!user?.id) {
      setErrors(['You must be logged in to save a learner profile.']);
      return;
    }

    setSaving(true);
    setErrors([]);
    setMessage('');

    const result = await interactor.saveProfile(user.id, formState);

    if (!result.success) {
      setErrors(result.errors ?? ['Unable to save learner profile.']);
      setSaving(false);
      return;
    }

    setUpdatedAt(result.profile?.updatedAt ?? '');
    setMessage('Learner profile saved. Adaptive recommendations can now use this profile data.');
    setSaving(false);
  };

  if (!user) {
    return <div className="learner-profile-shell"><p>Please log in to manage your learner profile.</p></div>;
  }

  return (
    <div className="learner-profile-shell">
      <section className="learner-profile-card">
        <div className="learner-profile-intro">
          <h1>Build your learner profile</h1>
          <p>
            This quick profile helps OpenFinAL decide what to emphasize, which lessons to recommend,
            and when to surface tutorials or contextual help.
          </p>
          {updatedAt ? <p className="learner-profile-meta">Last saved: {new Date(updatedAt).toLocaleString()}</p> : null}
        </div>

        {errors.length > 0 ? (
          <div className="learner-profile-alert learner-profile-alert-error" role="alert">
            <ul>
              {errors.map((error) => <li key={error}>{error}</li>)}
            </ul>
          </div>
        ) : null}

        {message ? <div className="learner-profile-alert learner-profile-alert-success">{message}</div> : null}

        {loading ? (
          <div className="learner-profile-loading">Loading profile…</div>
        ) : (
          <form className="learner-profile-form" onSubmit={handleSubmit}>
            <section>
              <h2>Current financial knowledge</h2>
              <div className="learner-profile-option-grid">
                {KNOWLEDGE_LEVELS.filter((level) => level !== 'unknown').map((level) => (
                  <label key={level} className="learner-profile-choice">
                    <input
                      type="radio"
                      name="knowledgeLevel"
                      value={level}
                      checked={formState.knowledgeLevel === level}
                      onChange={() => setFormState((current) => ({ ...current, knowledgeLevel: level }))}
                    />
                    <span>{KNOWLEDGE_LABELS[level]}</span>
                  </label>
                ))}
              </div>
            </section>

            <section>
              <h2>Investment goals</h2>
              <div className="learner-profile-option-grid">
                {INVESTMENT_GOALS.map((goal) => (
                  <label key={goal} className="learner-profile-choice">
                    <input
                      type="checkbox"
                      checked={formState.investmentGoals.includes(goal)}
                      onChange={() => handleCheckboxToggle('investmentGoals', goal)}
                    />
                    <span>{GOAL_LABELS[goal]}</span>
                  </label>
                ))}
              </div>
            </section>

            <section>
              <h2>Risk preference</h2>
              <div className="learner-profile-option-grid">
                {RISK_PREFERENCES.filter((risk) => risk !== 'unknown').map((risk) => (
                  <label key={risk} className="learner-profile-choice">
                    <input
                      type="radio"
                      name="riskPreference"
                      value={risk}
                      checked={formState.riskPreference === risk}
                      onChange={() => setFormState((current) => ({ ...current, riskPreference: risk }))}
                    />
                    <span>{RISK_LABELS[risk]}</span>
                  </label>
                ))}
              </div>
            </section>

            <section>
              <h2>Optional confidence and self-assessment</h2>
              <label className="learner-profile-field">
                <span>How confident do you feel making investing decisions right now? (1 = low, 5 = high)</span>
                <select
                  value={formState.confidenceScore ?? ''}
                  onChange={(event) => setFormState((current) => ({
                    ...current,
                    confidenceScore: event.target.value ? Number(event.target.value) : null,
                  }))}
                >
                  <option value="">Prefer not to answer</option>
                  {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>

              <label className="learner-profile-field">
                <span>Anything else you want the app to know about your learning needs?</span>
                <textarea
                  rows="4"
                  maxLength="500"
                  value={formState.selfAssessment}
                  onChange={(event) => setFormState((current) => ({ ...current, selfAssessment: event.target.value }))}
                  placeholder="Example: I understand the basics, but I still want step-by-step help when comparing stocks."
                />
              </label>
            </section>

            <section>
              <h2>Optional experience and progress markers</h2>
              <div className="learner-profile-option-grid">
                {EXPERIENCE_MARKERS.map((marker) => (
                  <label key={marker} className="learner-profile-choice">
                    <input
                      type="checkbox"
                      checked={formState.experienceMarkers.includes(marker)}
                      onChange={() => handleCheckboxToggle('experienceMarkers', marker)}
                    />
                    <span>{EXPERIENCE_LABELS[marker]}</span>
                  </label>
                ))}
              </div>

              <div className="learner-profile-progress-grid">
                <label className="learner-profile-field">
                  <span>How many investing learning modules have you completed?</span>
                  <select
                    value={formState.learningModulesCompleted}
                    onChange={(event) => setFormState((current) => ({
                      ...current,
                      learningModulesCompleted: Number(event.target.value),
                    }))}
                  >
                    {MODULE_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </label>

                <label className="learner-profile-field">
                  <span>How many practice trades have you completed?</span>
                  <select
                    value={formState.practiceTradesCompleted}
                    onChange={(event) => setFormState((current) => ({
                      ...current,
                      practiceTradesCompleted: Number(event.target.value),
                    }))}
                  >
                    {TRADE_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </label>
              </div>
            </section>

            <section>
              <h2>What do you want help with next?</h2>
              <div className="learner-profile-option-grid">
                {INTERESTED_TAGS.map((tag) => (
                  <label key={tag} className="learner-profile-choice">
                    <input
                      type="checkbox"
                      checked={formState.interestedTags.includes(tag)}
                      onChange={() => handleCheckboxToggle('interestedTags', tag)}
                    />
                    <span>{TAG_LABELS[tag]}</span>
                  </label>
                ))}
              </div>
            </section>

            <div className="learner-profile-actions">
              <button type="submit" className="save-button" disabled={saving}>
                {saving ? 'Saving…' : 'Save learner profile'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
