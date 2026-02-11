# Sports and Fitness Analytics

Sports analytics is the application of data analysis and statistics to athletic performance, team strategy, and business operations. From player evaluation to game prediction, data-driven insights are transforming how sports are played, managed, and consumed.

## Sports Statistics Fundamentals

### Why Statistics Matter in Sports
- Quantify player and team performance objectively
- Identify undervalued players and strategies
- Reduce bias in scouting and decision-making
- Predict outcomes and optimize strategies
- The "Moneyball" revolution: Oakland A's used statistics to compete with larger-budget teams

### Basic Statistical Measures
- **Counting stats**: goals, points, assists, rebounds (raw totals)
- **Rate stats**: per game, per minute, per possession (normalize for playing time)
- **Efficiency metrics**: shooting percentage, completion rate, save percentage
- **Percentiles and rankings**: compare players relative to peers
- Context matters: stats without context can be misleading

## Advanced Metrics by Sport

### Football (Soccer)
- **xG (Expected Goals)**: probability a shot becomes a goal based on position, angle, etc.
- **xA (Expected Assists)**: expected goals from key passes
- **Progressive carries/passes**: moves that advance the ball significantly
- **Pressing intensity**: how aggressively a team presses opponents
- **PPDA (Passes Per Defensive Action)**: measure of pressing efficiency
- Providers: Opta, StatsBomb, FBref, Understat

### Basketball (NBA)
- **PER (Player Efficiency Rating)**: single-number player evaluation
- **True Shooting % (TS%)**: shooting efficiency including free throws and 3-pointers
- **BPM (Box Plus-Minus)**: contribution per 100 possessions relative to average
- **Win Shares**: estimated wins a player contributes
- **RAPTOR / EPM**: advanced plus-minus models
- **Offensive/Defensive Rating**: points scored/allowed per 100 possessions
- Providers: NBA.com, Basketball Reference, Cleaning the Glass

### American Football (NFL)
- **EPA (Expected Points Added)**: value of each play relative to average
- **CPOE (Completion Percentage Over Expected)**: QB accuracy above model
- **DVOA (Defense-adjusted Value Over Average)**: team efficiency metric
- **Passer Rating / QBR**: quarterback performance composites
- **Yards After Catch (YAC)**: receiver contribution beyond the catch
- Providers: NFL Next Gen Stats, Pro Football Reference, Football Outsiders

### Baseball (MLB)
- **WAR (Wins Above Replacement)**: comprehensive player value metric
- **OPS+ (On-base Plus Slugging, adjusted)**: batting performance normalized
- **FIP (Fielding Independent Pitching)**: pitching performance independent of defense
- **wRC+ (Weighted Runs Created Plus)**: offensive value adjusted for park and era
- **Statcast**: ball exit velocity, launch angle, sprint speed, spin rate
- Providers: FanGraphs, Baseball Reference, Baseball Savant

### Other Sports
- **Hockey**: Corsi (shot attempts), expected goals model, RAPM
- **Tennis**: serve percentage, break point conversion, surface win rate
- **Cricket**: batting average, strike rate, economy rate, Duckworth-Lewis
- **Golf**: Strokes Gained (total and by category: putting, approach, etc.)

## Tracking Systems and Data Collection

### Player Tracking
- **GPS/GNSS**: outdoor player positioning (soccer, football, rugby)
- **Optical tracking**: camera-based systems (NBA Second Spectrum, Hawk-Eye)
- **Wearable sensors**: accelerometers, gyroscopes, heart rate monitors
- **UWB (Ultra-Wideband)**: precise indoor positioning
- Generate millions of data points per game

### Ball Tracking
- **Hawk-Eye**: ball trajectory in tennis, cricket, soccer (goal-line technology)
- **Statcast (MLB)**: radar + camera tracking ball flight and spin
- **TrackMan**: radar-based systems for golf and baseball
- **VAR (Video Assistant Referee)**: video review in soccer

### Data Collection Challenges
- Standardizing data across providers and leagues
- Sample size: early-season stats are unreliable
- Noise vs signal: separating skill from luck
- Survivorship bias: only seeing data from players who made it
- Context: same stat can mean different things in different situations

## Fantasy Sports

### Strategy
- Value-based drafting: target players who provide the most value above replacement
- Positional scarcity: prioritize positions with fewer elite options
- Streaming: rotate low-ownership players based on matchups
- Trade value: buy low on underperformers, sell high on overperformers
- Injury risk management and depth

### Key Metrics for Fantasy
- Consistency scores: how reliable are a player's points?
- Target share / usage rate: opportunity is more stable than production
- Strength of schedule: upcoming opponent difficulty
- Snap/minute counts: proxy for opportunity volume
- Rest-of-season projections vs season-to-date stats

### Platforms and Tools
- ESPN, Yahoo, Sleeper: major fantasy platforms
- FantasyPros: consensus rankings and projections
- Underdog Fantasy: best-ball and pick'em formats
- Dynasty leagues: keep players across seasons (long-term value)

## Betting Analytics

### Odds and Probability
- **American odds**: +150 means $150 profit on $100 bet; -150 means bet $150 to win $100
- **Decimal odds**: 2.50 means $2.50 total return per $1 bet
- **Implied probability**: convert odds to probability (1/decimal odds)
- **Overround/vig**: bookmaker's margin built into odds
- True probability vs implied probability = potential edge

### Analytical Approaches
- **Expected value (EV)**: (probability x payout) - stake
- **Closing Line Value (CLV)**: beating the final line is a strong indicator of skill
- **Power ratings**: rank teams on a numerical scale for matchup prediction
- **Regression models**: predict game outcomes from historical data
- **Sharp vs public**: distinguish informed money from recreational bettors

### Bankroll Management
- Never bet more than 1-5% of bankroll on a single bet
- Kelly Criterion: optimal bet size based on edge
- Track all bets systematically (ROI, win rate, by sport/bet type)
- Avoid chasing losses or increasing stakes after losing
- Long-term positive EV matters more than short-term results

## Performance Optimization

### Training Load Management
- **Acute:Chronic Workload Ratio**: balance recent training vs longer baseline
- **RPE (Rate of Perceived Exertion)**: subjective effort scale
- **Heart rate zones**: train at appropriate intensity
- **Recovery metrics**: HRV (heart rate variability), sleep quality, readiness scores
- Overtraining is as risky as undertraining

### Biomechanics
- Motion analysis for technique optimization
- Force plate analysis for jumping, sprinting, and cutting
- Video analysis with AI pose estimation
- Injury risk identification from movement patterns
- Sport-specific movement efficiency metrics

### Nutrition and Recovery
- Macronutrient periodization (match nutrition to training demands)
- Hydration monitoring and optimization
- Sleep tracking and optimization
- Cold/heat therapy, compression, massage
- Supplement evidence base (creatine, caffeine, beta-alanine)

## Player Evaluation and Scouting

### Scouting with Data
- Combine physical measurables with performance data
- Age curves: when do players typically peak in each sport?
- Projection models: predict future performance from current trajectory
- Comparable player analysis: find historical matches for prospects
- International scouting: adjust stats across different leagues/levels

### Draft Analytics
- Expected value by draft position
- Bust and hit rates by position and round
- Combine/test results vs actual performance correlation
- Aging curves and contract value optimization
- Surplus value: player performance minus salary cost

### Team Building
- Salary cap optimization: maximize talent within budget constraints
- Positional value: which positions contribute most to winning?
- Team composition: balance stars, starters, and role players
- Trade analysis: compare value exchanged using analytical frameworks

## Sports Data Platforms

### Data Sources
- **FBref / StatsBomb**: advanced soccer statistics
- **Basketball Reference / NBA.com**: comprehensive basketball data
- **FanGraphs / Baseball Savant**: advanced baseball analytics
- **Pro Football Reference**: NFL historical and advanced stats
- **Transfermarkt**: player valuations and transfer data (soccer)

### Analysis Tools
- **Python**: pandas, numpy, scikit-learn for sports analysis
- **R**: popular in academic sports research
- **Tableau / Power BI**: visualization dashboards
- **SQL**: querying large sports databases
- **Opta / Stats Perform**: professional sports data APIs

### Building Your Own Models
- Start with a clear question (predict wins, value players, etc.)
- Collect and clean relevant data
- Feature engineering: create meaningful input variables
- Choose appropriate model (linear regression, random forest, neural net)
- Validate with held-out data (avoid overfitting)
- Iterate: models improve as you understand the domain better
