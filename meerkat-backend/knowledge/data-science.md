# Data Science

Data science is the interdisciplinary field of extracting knowledge and insights from structured and unstructured data using statistics, programming, and domain expertise. It powers decision-making across industries from finance to healthcare to Web3.

## Statistics Fundamentals

### Descriptive Statistics
- **Mean**: arithmetic average of a dataset
- **Median**: middle value when data is sorted (robust to outliers)
- **Mode**: most frequently occurring value
- **Standard deviation**: measure of data spread around the mean
- **Variance**: standard deviation squared
- **Range**: difference between max and min values
- **Percentiles/Quartiles**: divide data into equal portions (Q1, Q2, Q3)

### Distributions
- **Normal (Gaussian)**: bell-shaped, symmetric (height, test scores)
- **Skewed**: asymmetric, long tail on one side (income distribution)
- **Uniform**: all outcomes equally likely (fair die)
- **Binomial**: number of successes in fixed trials (coin flips)
- **Poisson**: count of events in a fixed interval (website visits per hour)
- **Power law**: few items dominate (token holder distribution, social media followers)

### Central Limit Theorem
- Sample means approximate a normal distribution regardless of population shape
- Requires sufficiently large sample size (typically n > 30)
- Foundation for much of inferential statistics
- Enables confidence intervals and hypothesis testing

## Hypothesis Testing

### The Framework
1. State null hypothesis (H0): no effect or no difference
2. State alternative hypothesis (H1): there is an effect or difference
3. Choose significance level (alpha, typically 0.05)
4. Collect data and calculate test statistic
5. Compare p-value to alpha
6. Reject or fail to reject null hypothesis

### P-Values
- Probability of observing results as extreme as the data, assuming H0 is true
- p < 0.05: statistically significant (by convention)
- p-value does NOT tell you the probability that H0 is true
- Low p-value ≠ large or important effect
- Multiple testing problem: running many tests increases false positives

### Confidence Intervals
- Range of values likely to contain the true parameter
- 95% CI: if we repeated the experiment 100 times, ~95 intervals would contain the true value
- Wider interval = more uncertainty
- Narrower interval = more precision (usually requires more data)
- Overlapping CIs don't necessarily mean no significant difference

### Common Tests
- **t-test**: compare means of two groups
- **Chi-squared test**: test relationships between categorical variables
- **ANOVA**: compare means across multiple groups
- **Mann-Whitney U**: non-parametric alternative to t-test
- **Kolmogorov-Smirnov**: test if data follows a specific distribution

### A/B Testing
- Compare two versions (A and B) to determine which performs better
- Control group (A) vs treatment group (B)
- Requires sufficient sample size for statistical power
- Watch for: novelty effects, selection bias, peeking at results early
- Used for website optimization, feature launches, marketing campaigns

## Data Visualization

### Chart Types
- **Bar chart**: compare categories (market cap by protocol)
- **Line chart**: show trends over time (token price, TVL)
- **Scatter plot**: show relationship between two variables
- **Histogram**: show distribution of a single variable
- **Box plot**: show distribution summary (median, quartiles, outliers)
- **Heatmap**: show patterns in matrix data (correlation between assets)
- **Pie chart**: show proportions (use sparingly, bars often better)

### Visualization Best Practices
- Start Y-axis at zero for bar charts (avoid misleading)
- Label axes clearly with units
- Use color meaningfully (not just decoration)
- Don't overcrowd: one key message per chart
- Provide context: titles, annotations, reference lines
- Consider colorblind-friendly palettes

### Tools
- **Matplotlib / Seaborn**: Python plotting libraries
- **Plotly**: interactive charts (Python, JavaScript)
- **D3.js**: custom web visualizations
- **Tableau**: business intelligence dashboards
- **Dune Analytics**: blockchain-specific dashboards and visualization

## Python Data Stack

### Pandas
- Primary library for data manipulation in Python
- DataFrame: two-dimensional labeled data structure (like a spreadsheet)
- Read data: `pd.read_csv()`, `pd.read_json()`, `pd.read_sql()`
- Operations: filtering, grouping, merging, pivoting, aggregating
- Handle missing data: `fillna()`, `dropna()`, `interpolate()`

### NumPy
- Foundation for numerical computing in Python
- ndarray: efficient multi-dimensional array
- Mathematical operations: linear algebra, statistics, random numbers
- Vectorized operations (much faster than Python loops)
- Underlies Pandas, scikit-learn, and most data science libraries

### Jupyter Notebooks
- Interactive computing environment for data exploration
- Combine code, visualizations, and markdown text
- Cell-by-cell execution for iterative analysis
- Popular for data analysis, visualization, and sharing results
- JupyterLab, Google Colab, VS Code Jupyter extension

### Other Essential Libraries
- **scikit-learn**: machine learning algorithms and preprocessing
- **SciPy**: scientific computing and statistical functions
- **Statsmodels**: statistical modeling and hypothesis testing
- **XGBoost / LightGBM**: gradient boosting for structured data
- **Polars**: fast alternative to Pandas for large datasets

## Feature Engineering and Preprocessing

### Data Cleaning
- Handle missing values: imputation (mean, median, mode) or removal
- Remove duplicates
- Fix data type issues (strings to numbers, dates)
- Handle outliers: cap, remove, or transform
- Standardize formats (dates, currencies, units)

### Feature Creation
- Mathematical transformations: log, sqrt, polynomial features
- Date features: day of week, month, quarter, time since event
- Aggregations: rolling averages, cumulative sums
- Interaction features: multiply or combine existing features
- Text features: word count, sentiment, TF-IDF

### Encoding
- **One-hot encoding**: convert categories to binary columns
- **Label encoding**: assign integer to each category (ordinal data)
- **Target encoding**: replace category with mean of target variable
- **Embedding**: learn dense representations (for deep learning)

### Scaling
- **StandardScaler**: zero mean, unit variance (Z-score)
- **MinMaxScaler**: scale to [0, 1] range
- **RobustScaler**: uses median and IQR (robust to outliers)
- Important for distance-based algorithms (KNN, SVM, neural networks)

## Regression and Classification Metrics

### Regression Metrics
- **MAE (Mean Absolute Error)**: average absolute difference
- **MSE (Mean Squared Error)**: average squared difference (penalizes large errors)
- **RMSE (Root MSE)**: MSE in original units
- **R-squared**: proportion of variance explained (0 to 1)
- **MAPE**: mean absolute percentage error

### Classification Metrics
- **Accuracy**: correct predictions / total predictions
- **Precision**: true positives / predicted positives (when false positives are costly)
- **Recall**: true positives / actual positives (when false negatives are costly)
- **F1 Score**: harmonic mean of precision and recall
- **AUC-ROC**: trade-off between true positive and false positive rates
- **Confusion matrix**: table of actual vs predicted classes

## Time Series Analysis

### Components
- **Trend**: long-term direction (upward, downward, flat)
- **Seasonality**: regular patterns at fixed intervals
- **Cyclical**: patterns not at fixed intervals (economic cycles)
- **Noise**: random variation

### Methods
- **Moving averages**: smooth data to reveal trends
- **Exponential smoothing**: weighted average giving more weight to recent data
- **ARIMA**: autoregressive integrated moving average
- **Prophet**: Facebook's forecasting tool (trend + seasonality + holidays)
- **LSTM / Transformers**: deep learning for complex sequential patterns

### Crypto Time Series Considerations
- High volatility with heavy tails (non-normal distributions)
- 24/7 markets (no market close, no weekends off)
- Regime changes: bull/bear markets behave very differently
- External shocks: hacks, regulations, macro events
- On-chain data as additional features (active addresses, exchange flows)

## Correlation vs Causation

### Understanding the Difference
- Correlation: two variables move together (positive or negative)
- Causation: one variable directly causes changes in another
- Correlation does NOT imply causation
- Classic example: ice cream sales and drowning deaths both rise in summer (confound: temperature)

### Establishing Causation
- Randomized controlled experiments (gold standard)
- Natural experiments (exploit random events)
- Instrumental variables (find proxy that affects X but not Y directly)
- Difference-in-differences (compare before/after in treatment vs control)
- Caution: observational data can suggest associations but rarely proves causation

## Data Ethics and Privacy

### Responsible Data Use
- **Informed consent**: people should know how their data is used
- **Data minimization**: collect only what's needed
- **Anonymization**: remove personally identifiable information
- **Bias awareness**: check for demographic biases in data and models
- **Transparency**: document methodology, assumptions, and limitations

### Privacy Regulations
- GDPR (EU): right to access, delete, and port personal data
- CCPA (California): consumer data rights
- Blockchain considerations: on-chain data is permanently public
- Zero-knowledge proofs: prove claims without revealing underlying data
- Differential privacy: add noise to protect individuals while preserving aggregate patterns

### Ethical Considerations
- Avoid p-hacking (running many tests until one is significant)
- Report negative results, not just positive ones
- Be transparent about data limitations and uncertainty
- Consider who benefits and who might be harmed by your analysis
- Reproducibility: share code and data when possible
