# AI and Machine Learning

Artificial intelligence (AI) is the field of building systems that can perform tasks requiring human-like intelligence. Machine learning (ML) is a subset of AI where systems learn patterns from data rather than being explicitly programmed.

## Machine Learning Fundamentals

### Types of Machine Learning
- **Supervised Learning**: learn from labeled data (input-output pairs)
  - Classification: predict categories (spam/not spam, cat/dog)
  - Regression: predict continuous values (price, temperature)
- **Unsupervised Learning**: find patterns in unlabeled data
  - Clustering: group similar items (customer segments)
  - Dimensionality reduction: simplify complex data (PCA, t-SNE)
- **Reinforcement Learning**: learn by trial and error with rewards
  - Agent interacts with environment, maximizes cumulative reward
  - Used for games (AlphaGo), robotics, trading strategies

### Key Concepts
- **Features**: input variables the model uses to make predictions
- **Labels**: the target output in supervised learning
- **Training set**: data used to train the model
- **Validation set**: data used to tune hyperparameters
- **Test set**: held-out data for final evaluation
- **Overfitting**: model memorizes training data, performs poorly on new data
- **Underfitting**: model too simple to capture underlying patterns

### Common Algorithms
- **Linear Regression**: predict values from linear relationships
- **Logistic Regression**: classify into categories
- **Decision Trees**: flowchart-like model with if-then rules
- **Random Forest**: ensemble of many decision trees
- **Support Vector Machines (SVM)**: find optimal separating boundary
- **K-Nearest Neighbors (KNN)**: classify based on closest examples
- **Gradient Boosting** (XGBoost, LightGBM): powerful ensemble method

## Neural Networks

### Architecture
- Composed of layers of interconnected nodes (neurons)
- Input layer receives data, output layer produces predictions
- Hidden layers learn intermediate representations
- Each connection has a weight learned during training
- Activation functions introduce non-linearity (ReLU, sigmoid, tanh)

### Training Process
- **Forward pass**: data flows through network to produce prediction
- **Loss function**: measures how wrong the prediction is
- **Backpropagation**: calculates gradients of loss with respect to weights
- **Gradient descent**: adjusts weights to minimize loss
- **Learning rate**: controls size of weight updates
- **Epochs**: complete passes through the training data
- **Batch size**: number of samples processed before updating weights

### Types of Neural Networks
- **CNNs (Convolutional Neural Networks)**: images, spatial data
- **RNNs (Recurrent Neural Networks)**: sequences, time series
- **LSTMs (Long Short-Term Memory)**: long-range sequence dependencies
- **GANs (Generative Adversarial Networks)**: generate realistic data
- **Autoencoders**: learn compressed representations
- **Graph Neural Networks**: structured/relational data

## Transformers and Attention

### Attention Mechanism
- Allows model to focus on relevant parts of input
- Self-attention: each token attends to all other tokens in the sequence
- Scales better than RNNs for long sequences
- Multi-head attention: multiple attention patterns in parallel

### Transformer Architecture
- Encoder-decoder structure (original paper: "Attention Is All You Need")
- Encoder: processes input sequence (used in BERT, embeddings)
- Decoder: generates output sequence (used in GPT)
- Positional encoding: adds position information since attention is order-agnostic
- Layer normalization and residual connections for training stability

### Key Transformer Models
- **BERT**: bidirectional encoder, excels at understanding tasks
- **GPT series**: decoder-only, excels at text generation
- **T5**: encoder-decoder, versatile text-to-text framework
- **Vision Transformers (ViT)**: apply transformers to images

## Generative AI

### Large Language Models (LLMs)
- Trained on massive text corpora to predict next tokens
- Capabilities: text generation, summarization, translation, coding, reasoning
- Examples: GPT-4, Claude, Gemini, Llama, Mistral
- Scale matters: larger models generally perform better (scaling laws)
- Instruction tuning: fine-tuning to follow human instructions
- RLHF: reinforcement learning from human feedback for alignment

### Diffusion Models
- Generate images by learning to reverse a noise process
- Start from random noise, gradually denoise into an image
- Examples: Stable Diffusion, DALL-E, Midjourney
- Text-to-image: generate images from natural language descriptions
- ControlNet: add spatial control (pose, depth, edges)
- Fine-tuning with LoRA for custom styles or subjects

### Other Generative Models
- **GANs**: generator vs discriminator adversarial training
- **VAEs (Variational Autoencoders)**: encode to latent space, decode to generate
- **Audio models**: text-to-speech (ElevenLabs), music generation (Suno)
- **Video models**: text-to-video (Sora, Runway), video editing

## Training Concepts

### Data Preparation
- Data cleaning: handle missing values, outliers, duplicates
- Feature engineering: create meaningful input features
- Data augmentation: artificially expand training data
- Normalization: scale features to similar ranges
- Train/validation/test split: typically 70/15/15 or 80/10/10

### Training Dynamics
- **Batch size**: trade-off between speed and generalization
- **Learning rate scheduling**: reduce LR over time for fine-tuning
- **Early stopping**: stop when validation loss stops improving
- **Regularization**: L1, L2, dropout to prevent overfitting
- **Transfer learning**: start from pre-trained model, fine-tune for task

### Evaluation Metrics
- **Accuracy**: correct predictions / total predictions
- **Precision**: true positives / (true positives + false positives)
- **Recall**: true positives / (true positives + false negatives)
- **F1 Score**: harmonic mean of precision and recall
- **AUC-ROC**: area under receiver operating characteristic curve
- **Perplexity**: how well a language model predicts text (lower = better)

## Popular Frameworks

### PyTorch
- Most popular for research and production
- Dynamic computation graph (eager execution)
- Strong GPU support with CUDA
- Rich ecosystem: torchvision, torchaudio, torchtext
- Used by Meta, many academic institutions

### TensorFlow / Keras
- Google's ML framework
- Keras: high-level API for quick prototyping
- TensorFlow Lite for mobile/edge deployment
- TensorFlow.js for browser-based ML
- TFX for production ML pipelines

### Hugging Face
- Hub for sharing pre-trained models and datasets
- Transformers library: unified API for all major model architectures
- Datasets library: easy access to training data
- Spaces: host ML demos and apps
- Over 500,000+ models available

### Other Tools
- **scikit-learn**: classical ML algorithms (not deep learning)
- **JAX**: high-performance ML research (Google)
- **ONNX**: model interchange format between frameworks
- **MLflow**: experiment tracking and model management
- **Weights & Biases**: experiment tracking and visualization

## AI Agents and Autonomous Systems

### What Are AI Agents?
- AI systems that perceive their environment and take actions to achieve goals
- Can use tools (search, code execution, APIs) to accomplish tasks
- Combine LLMs with planning, memory, and tool use
- Examples: coding assistants, research agents, trading bots

### Agent Architecture
- **Planning**: break complex tasks into steps
- **Memory**: short-term (conversation) and long-term (knowledge base)
- **Tool use**: interact with external systems and APIs
- **Reflection**: evaluate and improve own outputs
- Frameworks: LangChain, AutoGPT, CrewAI, LlamaIndex

### On-Chain AI Agents
- AI agents with blockchain identities (e.g., ERC-8004 on Meerkat Town)
- Agents can own wallets, receive payments, execute transactions
- Reputation systems for trust and quality signals
- Micropayments for agent services (x402 protocol)
- Decentralized agent marketplaces

## Prompt Engineering and RAG

### Prompt Engineering
- Crafting effective instructions for LLMs
- Techniques: few-shot examples, chain-of-thought, role-playing
- System prompts set behavior and constraints
- Temperature controls randomness (0 = deterministic, 1 = creative)
- Structured output: JSON mode, function calling

### RAG (Retrieval-Augmented Generation)
- Enhance LLM responses with external knowledge
- Process: embed documents, store in vector database, retrieve relevant chunks
- Vector databases: Pinecone, Weaviate, Chroma, Qdrant
- Embedding models convert text to numerical vectors
- Retrieve top-K relevant documents based on similarity
- Append retrieved context to the LLM prompt

### Fine-Tuning vs RAG
- Fine-tuning: modify model weights with domain-specific data
- RAG: provide context at inference time without modifying weights
- RAG: easier to update knowledge, no training needed
- Fine-tuning: better for learning new patterns or styles
- Often combined: fine-tuned model + RAG for best results

## AI Ethics and Safety

### Bias and Fairness
- Models can amplify biases present in training data
- Demographic bias: different performance across groups
- Representation bias: underrepresentation in training data
- Mitigation: diverse datasets, bias auditing, fairness constraints

### AI Alignment
- Ensuring AI systems act in accordance with human values
- Challenges: specification gaming, reward hacking, goal misgeneralization
- RLHF as an alignment technique
- Constitutional AI: train models with explicit principles
- Ongoing research area with significant stakes

### Responsible AI Practices
- Transparency: explain how models make decisions
- Privacy: protect training data and user data
- Accountability: clear ownership of AI system outputs
- Human oversight: keep humans in the loop for critical decisions
- Robustness: ensure models perform well under adversarial conditions
