# Cloud Computing Fundamentals

## What is Cloud Computing?

Cloud computing delivers computing services (servers, storage, databases, networking, software) over the internet ("the cloud") on a pay-as-you-go basis.

### Key Characteristics
- On-demand self-service: Provision resources without human interaction
- Broad network access: Available over the network via standard mechanisms
- Resource pooling: Provider resources pooled to serve multiple consumers
- Rapid elasticity: Scale up or down quickly based on demand
- Measured service: Pay only for what you use

## Cloud Service Models

### IaaS (Infrastructure as a Service)
Provides virtualized computing resources over the internet.
- Virtual machines, storage, networks
- You manage: OS, middleware, runtime, data, applications
- Provider manages: Virtualization, servers, storage, networking
- Examples: AWS EC2, Google Compute Engine, Azure VMs

### PaaS (Platform as a Service)
Provides platform for developing, running, and managing applications.
- You manage: Applications and data
- Provider manages: Everything else (runtime, middleware, OS, infrastructure)
- Examples: Heroku, Google App Engine, Azure App Service, Vercel

### SaaS (Software as a Service)
Delivers software applications over the internet.
- You manage: Just your data and access
- Provider manages: Everything
- Examples: Gmail, Salesforce, Dropbox, Slack, Microsoft 365

### FaaS (Function as a Service) / Serverless
Run code without managing servers.
- Event-driven, scales automatically
- Pay only when code runs
- Examples: AWS Lambda, Google Cloud Functions, Azure Functions

## Major Cloud Providers

### Amazon Web Services (AWS)
- Market leader (~32% market share)
- Most services and features
- Key services: EC2, S3, Lambda, RDS, DynamoDB
- Regions: 30+ worldwide

### Microsoft Azure
- Strong enterprise integration
- Hybrid cloud leader
- Key services: Virtual Machines, Blob Storage, Functions, SQL Database
- Good for Microsoft ecosystem

### Google Cloud Platform (GCP)
- Strong in data analytics and ML
- Kubernetes originated here
- Key services: Compute Engine, Cloud Storage, BigQuery, Cloud Functions
- Competitive pricing

### Other Providers
- DigitalOcean: Developer-friendly, simple pricing
- Linode: Affordable VPS hosting
- Vultr: High-performance cloud compute
- Oracle Cloud: Enterprise databases
- IBM Cloud: AI and enterprise services

## Core Cloud Services

### Compute
- Virtual Machines: Scalable compute capacity
- Containers: Docker, Kubernetes orchestration
- Serverless: Event-driven functions
- Auto-scaling: Automatic capacity adjustment

### Storage
- Object Storage: S3, Cloud Storage (files, media, backups)
- Block Storage: EBS, Persistent Disk (attached to VMs)
- File Storage: EFS, Filestore (shared file systems)
- Archive Storage: Glacier, Archive (long-term, infrequent access)

### Databases
- Relational: RDS, Cloud SQL (MySQL, PostgreSQL)
- NoSQL: DynamoDB, Firestore, MongoDB Atlas
- In-memory: ElastiCache, Memorystore (Redis)
- Data warehouse: Redshift, BigQuery, Snowflake

### Networking
- Virtual Private Cloud (VPC): Isolated network
- Load Balancers: Distribute traffic
- CDN: Content delivery networks (CloudFront, Cloud CDN)
- DNS: Route 53, Cloud DNS
- VPN/Direct Connect: Secure connections

## Cloud Architecture Patterns

### High Availability
- Multiple availability zones
- Load balancing
- Auto-scaling groups
- Database replication
- Health checks and failover

### Microservices
- Small, independent services
- API communication
- Container orchestration
- Service mesh
- Independent scaling

### Serverless Architecture
- Functions as compute
- Managed services for everything
- Event-driven design
- Pay-per-execution
- No server management

### Hybrid Cloud
- Mix of on-premises and cloud
- Data residency requirements
- Gradual migration
- Burst capacity to cloud

## Cloud Security

### Shared Responsibility Model
- Provider secures: Physical infrastructure, network, hypervisor
- Customer secures: Data, applications, access management, OS patches

### Security Best Practices
- Identity and Access Management (IAM)
- Encryption at rest and in transit
- Network security groups/firewalls
- Regular security audits
- Compliance certifications (SOC 2, HIPAA, GDPR)
- Multi-factor authentication
- Principle of least privilege

## Cost Management

### Pricing Models
- On-demand: Pay by the hour/second
- Reserved: Commit for 1-3 years, save 30-75%
- Spot/Preemptible: Unused capacity, save up to 90%
- Savings Plans: Flexible commitment discounts

### Cost Optimization
- Right-sizing: Match resources to needs
- Auto-scaling: Scale down when not needed
- Reserved instances for predictable workloads
- Spot instances for fault-tolerant workloads
- Delete unused resources
- Use cost monitoring tools

## DevOps and Cloud

### Infrastructure as Code (IaC)
- Terraform: Multi-cloud, declarative
- CloudFormation: AWS native
- Pulumi: Programming languages
- Ansible: Configuration management

### CI/CD in Cloud
- AWS CodePipeline
- Google Cloud Build
- Azure DevOps
- GitHub Actions
- GitLab CI
