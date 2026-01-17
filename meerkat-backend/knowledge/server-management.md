# Server Management Fundamentals

## Server Types

### Physical Servers
- Dedicated hardware
- Full control and performance
- Higher upfront cost
- Maintenance responsibility
- Data center or on-premises

### Virtual Servers (VMs)
- Hypervisor-based virtualization
- Share physical hardware
- Easier scaling
- Snapshot and backup capabilities
- Examples: VMware, KVM, Hyper-V

### Containers
- Lightweight, share OS kernel
- Fast startup times
- Consistent environments
- Docker, containerd
- Orchestration: Kubernetes, Docker Swarm

## Linux Server Administration

### Essential Commands
```
# System information
uname -a          # System info
hostnamectl       # Hostname and OS
uptime            # System uptime
df -h             # Disk usage
free -m           # Memory usage
top / htop        # Process monitoring

# File operations
ls -la            # List files with details
cd, pwd, mkdir    # Navigation
cp, mv, rm        # Copy, move, remove
chmod, chown      # Permissions
find, locate      # Search files

# Process management
ps aux            # List processes
kill, killall     # Terminate processes
systemctl         # Service management
journalctl        # System logs
```

### Package Management
- Debian/Ubuntu: apt, apt-get, dpkg
- RHEL/CentOS: yum, dnf, rpm
- Arch: pacman
- Alpine: apk

### User Management
- useradd/adduser: Create users
- usermod: Modify users
- userdel: Delete users
- passwd: Set passwords
- groups: Manage group membership
- sudo: Elevated privileges

## Web Servers

### Nginx
- High performance, event-driven
- Reverse proxy and load balancer
- Static content serving
- SSL/TLS termination
- Configuration: /etc/nginx/

### Apache
- Mature, widely used
- .htaccess support
- Module system
- Virtual hosts
- Configuration: /etc/apache2/ or /etc/httpd/

### Caddy
- Automatic HTTPS
- Simple configuration
- Modern, Go-based
- Great for development

## Database Servers

### MySQL/MariaDB
- Relational database
- ACID compliant
- Replication support
- Tools: mysql, mysqldump, mysqltuner

### PostgreSQL
- Advanced relational database
- JSON support
- Extensions ecosystem
- Tools: psql, pg_dump

### MongoDB
- Document database
- JSON-like documents
- Horizontal scaling
- Tools: mongosh, mongodump

### Redis
- In-memory data store
- Caching layer
- Pub/sub messaging
- Session storage

## Security

### SSH Hardening
- Disable root login
- Use SSH keys, not passwords
- Change default port
- Fail2ban for brute force protection
- AllowUsers directive

### Firewall
- UFW (Ubuntu): Simple firewall
- firewalld (RHEL): Zone-based
- iptables: Low-level rules
- Allow only necessary ports

### SSL/TLS Certificates
- Let's Encrypt: Free certificates
- Certbot: Automatic renewal
- SSL Labs: Test configuration
- Force HTTPS redirects

### Security Best Practices
- Keep systems updated
- Principle of least privilege
- Regular security audits
- Log monitoring
- Intrusion detection (fail2ban, OSSEC)
- Disable unused services

## Monitoring and Logging

### System Monitoring
- Prometheus: Metrics collection
- Grafana: Visualization dashboards
- Nagios: Traditional monitoring
- Zabbix: Enterprise monitoring
- Datadog: Cloud monitoring SaaS

### Log Management
- journalctl: Systemd logs
- /var/log/: Log directory
- logrotate: Log rotation
- ELK Stack: Elasticsearch, Logstash, Kibana
- Loki: Log aggregation

### Key Metrics
- CPU usage and load average
- Memory utilization
- Disk I/O and space
- Network throughput
- Application response times
- Error rates

## Backup and Recovery

### Backup Types
- Full backup: Complete copy
- Incremental: Changes since last backup
- Differential: Changes since last full backup

### Backup Tools
- rsync: File synchronization
- tar: Archive creation
- mysqldump/pg_dump: Database backups
- Restic/Borg: Deduplicated backups
- Velero: Kubernetes backups

### Backup Best Practices
- 3-2-1 rule: 3 copies, 2 media types, 1 offsite
- Regular testing of restores
- Automated backup schedules
- Encryption for sensitive data
- Retention policies

## Automation

### Configuration Management
- Ansible: Agentless, YAML playbooks
- Puppet: Agent-based, declarative
- Chef: Ruby-based recipes
- SaltStack: Fast, scalable

### Infrastructure as Code
- Terraform: Multi-cloud provisioning
- CloudFormation: AWS native
- Pulumi: Programming languages

### CI/CD Integration
- Automated deployments
- Blue-green deployments
- Rolling updates
- Canary releases
- Rollback capabilities

## Performance Tuning

### System Level
- Kernel parameters (sysctl)
- File descriptor limits
- TCP tuning
- Disk I/O schedulers

### Application Level
- Connection pooling
- Caching strategies
- Query optimization
- Load balancing
- Content delivery networks

### Database Tuning
- Index optimization
- Query analysis (EXPLAIN)
- Connection limits
- Buffer pool sizing
- Slow query logging
