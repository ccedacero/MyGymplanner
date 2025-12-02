# Interview Quick Reference Guide
## Backend Engineer - NYC Job Search

---

## 🔥 Pattern Templates (Copy-Paste Ready)

### Two Pointers
```python
def two_pointers(arr, target):
    left, right = 0, len(arr) - 1

    while left < right:
        current_sum = arr[left] + arr[right]

        if current_sum == target:
            return [left, right]
        elif current_sum < target:
            left += 1
        else:
            right -= 1

    return [-1, -1]
```

### Sliding Window (Variable Size)
```python
def sliding_window(s):
    left = 0
    window_map = {}
    max_length = 0

    for right in range(len(s)):
        # Expand window
        window_map[s[right]] = window_map.get(s[right], 0) + 1

        # Shrink window if invalid
        while is_invalid(window_map):
            window_map[s[left]] -= 1
            if window_map[s[left]] == 0:
                del window_map[s[left]]
            left += 1

        # Update result
        max_length = max(max_length, right - left + 1)

    return max_length
```

### Binary Search
```python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1

    while left <= right:
        mid = left + (right - left) // 2

        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return -1

# Find first occurrence (left boundary)
def binary_search_left(arr, target):
    left, right = 0, len(arr)

    while left < right:
        mid = left + (right - left) // 2

        if arr[mid] < target:
            left = mid + 1
        else:
            right = mid

    return left
```

### DFS (Recursive)
```python
def dfs(node, visited):
    if not node or node in visited:
        return

    visited.add(node)
    # Process node

    for neighbor in node.neighbors:
        dfs(neighbor, visited)
```

### DFS (Iterative)
```python
def dfs_iterative(root):
    if not root:
        return

    stack = [root]
    visited = set()

    while stack:
        node = stack.pop()

        if node in visited:
            continue

        visited.add(node)
        # Process node

        for neighbor in node.neighbors:
            if neighbor not in visited:
                stack.append(neighbor)
```

### BFS
```python
from collections import deque

def bfs(root):
    if not root:
        return

    queue = deque([root])
    visited = set([root])

    while queue:
        node = queue.popleft()
        # Process node

        for neighbor in node.neighbors:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
```

### BFS (Level-Order)
```python
from collections import deque

def bfs_level_order(root):
    if not root:
        return []

    result = []
    queue = deque([root])

    while queue:
        level_size = len(queue)
        current_level = []

        for _ in range(level_size):
            node = queue.popleft()
            current_level.append(node.val)

            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)

        result.append(current_level)

    return result
```

### Dynamic Programming (1D)
```python
def dp_1d(nums):
    if not nums:
        return 0

    n = len(nums)
    dp = [0] * n

    # Base case
    dp[0] = nums[0]

    # Fill dp array
    for i in range(1, n):
        dp[i] = max(dp[i-1], nums[i])  # Recurrence relation

    return dp[-1]

# Space-optimized (if only need previous state)
def dp_optimized(nums):
    if not nums:
        return 0

    prev = nums[0]

    for i in range(1, len(nums)):
        current = max(prev, nums[i])
        prev = current

    return prev
```

### Dynamic Programming (2D)
```python
def dp_2d(grid):
    if not grid:
        return 0

    m, n = len(grid), len(grid[0])
    dp = [[0] * n for _ in range(m)]

    # Base cases
    dp[0][0] = grid[0][0]

    # Fill first row and column
    for i in range(1, m):
        dp[i][0] = dp[i-1][0] + grid[i][0]
    for j in range(1, n):
        dp[0][j] = dp[0][j-1] + grid[0][j]

    # Fill rest
    for i in range(1, m):
        for j in range(1, n):
            dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1])

    return dp[-1][-1]
```

### Backtracking
```python
def backtrack(result, path, choices):
    # Base case
    if is_complete(path):
        result.append(path[:])  # Make a copy!
        return

    for choice in choices:
        # Make choice
        path.append(choice)

        # Recurse with remaining choices
        backtrack(result, path, remaining_choices(choice))

        # Undo choice (backtrack)
        path.pop()

# Example: Generate all subsets
def subsets(nums):
    result = []

    def backtrack(start, path):
        result.append(path[:])

        for i in range(start, len(nums)):
            path.append(nums[i])
            backtrack(i + 1, path)
            path.pop()

    backtrack(0, [])
    return result
```

### Heap (Min-Heap)
```python
import heapq

# Min-heap operations
heap = []
heapq.heappush(heap, item)
smallest = heapq.heappop(heap)
smallest = heap[0]  # Peek without removing

# Max-heap (negate values)
max_heap = []
heapq.heappush(max_heap, -item)
largest = -heapq.heappop(max_heap)

# Top K elements
def top_k_frequent(nums, k):
    from collections import Counter
    count = Counter(nums)
    return heapq.nlargest(k, count.keys(), key=count.get)

# Merge K sorted lists
def merge_k_sorted(lists):
    heap = []

    # Initialize heap with first element from each list
    for i, lst in enumerate(lists):
        if lst:
            heapq.heappush(heap, (lst[0], i, 0))

    result = []

    while heap:
        val, list_idx, elem_idx = heapq.heappop(heap)
        result.append(val)

        # Add next element from same list
        if elem_idx + 1 < len(lists[list_idx]):
            next_val = lists[list_idx][elem_idx + 1]
            heapq.heappush(heap, (next_val, list_idx, elem_idx + 1))

    return result
```

### Trie
```python
class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_end = True

    def search(self, word):
        node = self.root
        for char in word:
            if char not in node.children:
                return False
            node = node.children[char]
        return node.is_end

    def starts_with(self, prefix):
        node = self.root
        for char in prefix:
            if char not in node.children:
                return False
            node = node.children[char]
        return True
```

### Union-Find (Disjoint Set)
```python
class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])  # Path compression
        return self.parent[x]

    def union(self, x, y):
        root_x = self.find(x)
        root_y = self.find(y)

        if root_x == root_y:
            return False

        # Union by rank
        if self.rank[root_x] < self.rank[root_y]:
            self.parent[root_x] = root_y
        elif self.rank[root_x] > self.rank[root_y]:
            self.parent[root_y] = root_x
        else:
            self.parent[root_y] = root_x
            self.rank[root_x] += 1

        return True

    def connected(self, x, y):
        return self.find(x) == self.find(y)
```

### Monotonic Stack
```python
# Next Greater Element
def next_greater_elements(nums):
    n = len(nums)
    result = [-1] * n
    stack = []

    for i in range(n):
        while stack and nums[i] > nums[stack[-1]]:
            idx = stack.pop()
            result[idx] = nums[i]
        stack.append(i)

    return result

# Largest Rectangle in Histogram
def largest_rectangle_area(heights):
    stack = []
    max_area = 0

    for i, h in enumerate(heights):
        start = i

        while stack and stack[-1][1] > h:
            idx, height = stack.pop()
            max_area = max(max_area, height * (i - idx))
            start = idx

        stack.append((start, h))

    # Remaining elements
    for i, h in stack:
        max_area = max(max_area, h * (len(heights) - i))

    return max_area
```

---

## 📊 Time Complexity Cheat Sheet

### Common Complexities (Best to Worst)
| Complexity | Name | Example |
|-----------|------|---------|
| O(1) | Constant | Hash table lookup, array index access |
| O(log n) | Logarithmic | Binary search, balanced tree operations |
| O(n) | Linear | Array traversal, single loop |
| O(n log n) | Linearithmic | Merge sort, heap sort, efficient sorting |
| O(n²) | Quadratic | Nested loops, bubble sort |
| O(2ⁿ) | Exponential | Recursive fibonacci (naive), backtracking |
| O(n!) | Factorial | Permutations, traveling salesman (brute force) |

### Data Structure Operations

**Array/List:**
- Access: O(1)
- Search: O(n)
- Insert/Delete (end): O(1) amortized
- Insert/Delete (middle): O(n)

**Hash Table:**
- Search/Insert/Delete: O(1) average, O(n) worst

**Binary Search Tree (Balanced):**
- Search/Insert/Delete: O(log n)

**Binary Search Tree (Unbalanced):**
- Search/Insert/Delete: O(n) worst

**Heap:**
- Find min/max: O(1)
- Insert/Delete: O(log n)
- Heapify: O(n)

**Trie:**
- Search/Insert/Delete: O(m) where m is word length

**Graph (Adjacency List):**
- Add vertex: O(1)
- Add edge: O(1)
- Remove vertex: O(V + E)
- Remove edge: O(E)
- Query edge: O(V)

### Sorting Algorithms
| Algorithm | Time (Best) | Time (Avg) | Time (Worst) | Space | Stable? |
|-----------|------------|------------|--------------|-------|---------|
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) | Yes |
| Selection Sort | O(n²) | O(n²) | O(n²) | O(1) | No |
| Insertion Sort | O(n) | O(n²) | O(n²) | O(1) | Yes |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) | No |
| Heap Sort | O(n log n) | O(n log n) | O(n log n) | O(1) | No |
| Counting Sort | O(n+k) | O(n+k) | O(n+k) | O(k) | Yes |

---

## 🏗️ System Design Cheat Sheet

### Numbers Every Backend Engineer Should Know (2025)

```
L1 cache reference               0.5 ns
L2 cache reference               7 ns
Main memory reference            100 ns
SSD random read                  150 μs (150,000 ns)
Round trip within datacenter     500 μs
Read 1MB sequentially from SSD   1 ms
Disk seek                        10 ms
Round trip CA to Netherlands     150 ms
```

**Implications:**
- Memory is 100x faster than SSD
- Reading from SSD is 100x faster than disk seek
- Cross-continent latency is significant (use CDN/regional deployments)

### Scale Estimations

**QPS (Queries Per Second) Calculations:**
```
DAU (Daily Active Users):      100 million
Avg requests per user per day: 50
Total requests per day:        5 billion
Requests per second:           5B / 86400 = 58K QPS
Peak QPS (3x avg):            174K QPS
```

**Storage Calculations:**
```
Users:              100 million
Avg data per user:  10 KB
Total storage:      100M × 10KB = 1TB

With 5 years retention and 20% annual growth:
Year 1: 1 TB
Year 2: 1.2 TB
Year 3: 1.44 TB
Year 4: 1.73 TB
Year 5: 2.07 TB
Total: ~8 TB
```

**Bandwidth Calculations:**
```
Video uploads per day:  1 million
Avg video size:        100 MB
Daily upload bandwidth: 1M × 100MB = 100 TB/day
                       = 100TB / 86400s = 1.16 GB/s upload

With 10:1 read:write ratio:
Download bandwidth:    11.6 GB/s
```

### Database Scaling Decision Tree

```
Start: Single database server
  ↓
Traffic increasing?
  ↓
Add Read Replicas (handle 10K-100K QPS)
  ↓
Still slow writes?
  ↓
Vertical Scaling (bigger server, handle up to 100K QPS)
  ↓
Hit single-server limits?
  ↓
Horizontal Sharding (handle 1M+ QPS)
  ├─ Shard by user_id (even distribution)
  ├─ Shard by geography (data locality)
  └─ Shard by feature (different tables on different servers)
```

### System Design Patterns

**1. Load Balancing Patterns:**
- **DNS Load Balancing:** Route to different IPs
- **L4 (Transport Layer):** Fast, TCP/UDP level
- **L7 (Application Layer):** Content-based routing, SSL termination

**2. Caching Patterns:**
- **Cache-Aside:** App manages cache
- **Read-Through:** Cache manages loading
- **Write-Through:** Sync write to cache + DB
- **Write-Behind:** Async write to DB
- **Refresh-Ahead:** Predictive preloading

**3. Data Partitioning:**
- **Horizontal (Sharding):** Split rows across servers
- **Vertical:** Split columns across servers
- **Functional:** Split tables by domain

**4. Replication:**
- **Master-Slave:** Single write source
- **Master-Master:** Multiple write sources (conflict resolution needed)
- **Multi-region:** Cross-datacenter replication

**5. Consistency Patterns:**
- **Strong Consistency:** All nodes see same data (CP)
- **Eventual Consistency:** Nodes converge over time (AP)
- **Causal Consistency:** Related events ordered
- **Read-Your-Writes:** Your writes immediately visible to you

**6. Availability Patterns:**
- **Active-Passive (Failover):** Standby server takes over
- **Active-Active:** Multiple servers handle traffic
- **Circuit Breaker:** Fail fast when dependency down

### API Design Patterns

**REST API Best Practices:**
```
Resource naming:
  ✓ /users (plural, noun)
  ✗ /getUsers (verb)

Hierarchy:
  ✓ /users/123/orders/456
  ✗ /getUserOrder?userId=123&orderId=456

Versioning:
  ✓ /api/v1/users
  ✗ /api/users?version=1

Pagination:
  ✓ /users?limit=20&offset=100
  ✓ /users?cursor=abc123&limit=20

Filtering:
  ✓ /users?status=active&role=admin

HTTP methods:
  GET    - Read
  POST   - Create
  PUT    - Replace (full update)
  PATCH  - Modify (partial update)
  DELETE - Remove

Status codes:
  200 - OK
  201 - Created
  204 - No Content
  400 - Bad Request
  401 - Unauthorized
  403 - Forbidden
  404 - Not Found
  429 - Too Many Requests
  500 - Internal Server Error
  503 - Service Unavailable
```

### Database Schema Design Patterns

**Normalization vs Denormalization:**

**Normalize when:**
- Data consistency critical
- Frequent updates
- Low redundancy important
- Complex queries with JOINs acceptable

**Denormalize when:**
- Read-heavy workload
- Low update frequency
- Query performance critical
- JOINs become bottleneck

**Indexing Strategy:**
```sql
-- Index columns used in WHERE
CREATE INDEX idx_users_email ON users(email);

-- Composite index for multi-column queries
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at);

-- Cover index includes all needed columns
CREATE INDEX idx_users_cover ON users(email, name, status);

-- Partial index for subset of rows
CREATE INDEX idx_active_users ON users(email) WHERE status = 'active';
```

**Partitioning Strategies:**
```sql
-- Range partitioning (by date)
CREATE TABLE orders_2024 PARTITION OF orders
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Hash partitioning (even distribution)
CREATE TABLE users PARTITION BY HASH (user_id);

-- List partitioning (by category)
CREATE TABLE logs PARTITION BY LIST (region);
```

### Microservices Patterns

**Service Communication:**
- **Synchronous:** REST, gRPC (low latency, tight coupling)
- **Asynchronous:** Message queues (decoupling, resilience)

**Data Management:**
- **Database per Service:** Each service owns its data
- **Shared Database:** Anti-pattern (tight coupling)
- **Saga Pattern:** Distributed transactions via events

**Resilience Patterns:**
- **Circuit Breaker:** Stop calling failing service
- **Retry with Backoff:** Exponential backoff (2s, 4s, 8s...)
- **Timeout:** Don't wait forever
- **Bulkhead:** Isolate resources (separate thread pools)

---

## 🎤 Behavioral Interview Framework

### STAR Method Template

**Situation (1-2 sentences):**
"At [Company], I was working on [project/team] when [context/problem] occurred."

**Task (1 sentence):**
"I was responsible for [specific goal/challenge]."

**Action (3-4 sentences - MOST IMPORTANT):**
"First, I [action 1]. Then I [action 2]. I also [action 3]. Finally, I [action 4]."

**Result (1-2 sentences with metrics):**
"As a result, [quantifiable outcome]. This led to [broader impact]."

### Question Categories with Examples

**Leadership:**
- "Tell me about a time you mentored someone"
- "Describe when you led a project"
- "How did you handle team conflict?"

**Technical Challenge:**
- "Describe your most complex technical project"
- "Tell me about a time you optimized performance"
- "How did you handle a production outage?"

**Failure/Learning:**
- "Tell me about a time you made a mistake"
- "Describe a failed project"
- "When did you receive critical feedback?"

**Ambiguity:**
- "Describe a time with unclear requirements"
- "How did you handle changing priorities?"
- "Tell me about starting a project from scratch"

**Collaboration:**
- "Tell me about cross-team collaboration"
- "How did you influence without authority?"
- "Describe working with a difficult stakeholder"

**Trade-offs:**
- "Tell me about a difficult technical decision"
- "When did you choose speed over perfection?"
- "How did you balance competing priorities?"

### Common Follow-up Questions

After any STAR answer, expect:
- "What was the other person's perspective?"
- "What alternatives did you consider?"
- "What would you do differently now?"
- "How did you measure success?"
- "What was the long-term impact?"
- "How did this change your approach going forward?"

### Backend-Specific Story Angles

Prepare stories showcasing:
- **Scalability:** "Scaled system from 1K to 100K QPS"
- **Performance:** "Reduced latency from 2s to 200ms"
- **Reliability:** "Improved uptime from 99.9% to 99.99%"
- **Architecture:** "Migrated from monolith to microservices"
- **Database:** "Optimized query performance, implemented sharding"
- **API Design:** "Designed RESTful API used by 10 clients"
- **Monitoring:** "Implemented observability, reduced MTTR by 50%"

---

## 💡 Interview Day Checklist

### 24 Hours Before
- [ ] Review pattern cheat sheets (this document!)
- [ ] Re-read your STAR stories
- [ ] Research company and interviewer (LinkedIn)
- [ ] Prepare 3-5 questions to ask
- [ ] Test video/audio setup
- [ ] Get 8 hours of sleep

### Morning Of
- [ ] Light breakfast (avoid heavy meal)
- [ ] Do 1-2 LeetCode easy warmups
- [ ] Review behavioral stories
- [ ] Set up interview space (quiet, clean background)
- [ ] Have water, pen, paper ready
- [ ] Close all tabs/apps except what's needed
- [ ] Join 5 minutes early

### During Coding Interview
- [ ] Repeat/clarify the problem
- [ ] Ask about constraints (input size, edge cases)
- [ ] Think out loud
- [ ] Start with brute force approach
- [ ] Optimize before coding (if time permits)
- [ ] Write clean code with good variable names
- [ ] Test with example inputs
- [ ] Analyze time/space complexity
- [ ] Handle edge cases

### During System Design Interview
- [ ] Clarify functional requirements (5 min)
- [ ] Clarify non-functional requirements (scale, latency, consistency)
- [ ] Estimate scale (QPS, storage, bandwidth)
- [ ] Draw high-level diagram (10 min)
- [ ] Get interviewer buy-in before deep dive
- [ ] Design 2-3 components in detail (20 min)
- [ ] Discuss trade-offs explicitly
- [ ] Address bottlenecks and optimizations (5 min)
- [ ] Summarize and discuss future extensions

### During Behavioral Interview
- [ ] Use STAR method for every answer
- [ ] Keep answers under 3 minutes
- [ ] Be specific, not generic
- [ ] Show learning from failures
- [ ] Demonstrate collaboration
- [ ] Ask clarifying questions if needed

### After Interview
- [ ] Send thank-you email within 24 hours
- [ ] Document questions asked
- [ ] Note areas for improvement
- [ ] Update preparation materials

---

## 🚀 Quick Win Strategies

### If You Have Limited Time

**1 Week Prep (Minimal):**
- Focus on Blind 75 problems only
- Review 3 system design patterns: URL shortener, cache, rate limiter
- Prepare 5 STAR stories

**2 Week Prep (Cramming):**
- Top 5 LeetCode patterns: Two Pointers, Sliding Window, DFS/BFS, Binary Search, DP
- Top 5 system designs: URL shortener, social media, messaging, payment, cache
- 8 STAR stories covering all categories

**4 Week Prep (Solid):**
- Top 10 LeetCode patterns with 10 problems each
- Top 10 system designs with deep understanding
- 10 polished STAR stories

**12 Week Prep (Ideal):**
- Follow full study plan in main document

### Pattern Recognition Shortcuts

**How to identify the pattern from problem description:**

| Keywords | Pattern |
|----------|---------|
| "Contiguous subarray", "substring" | Sliding Window |
| "Sorted array", "find target" | Binary Search |
| "Two elements sum to", "pair" | Two Pointers |
| "Tree traversal", "path in tree" | DFS/BFS |
| "Graph connectivity", "island" | DFS/BFS/Union-Find |
| "Top K", "Kth largest/smallest" | Heap |
| "Optimize", "maximum/minimum", "count ways" | Dynamic Programming |
| "All combinations", "all permutations" | Backtracking |
| "Next greater/smaller" | Monotonic Stack |
| "Linked list cycle", "find middle" | Fast & Slow Pointers |

### System Design Quick Checks

**Before finishing any system design, verify you covered:**
- [ ] High-level architecture diagram
- [ ] Database schema design
- [ ] API endpoints defined
- [ ] Caching strategy discussed
- [ ] Scaling approach (sharding, replication)
- [ ] At least 2 trade-offs explicitly stated
- [ ] Monitoring/alerting mentioned
- [ ] At least 1 failure scenario addressed

---

## 📞 Questions to Ask Interviewers

### Technical Questions
1. "What's the most interesting technical challenge the team is facing?"
2. "How does the team approach technical debt?"
3. "What's your deployment process? How often do you deploy?"
4. "What monitoring and observability tools do you use?"
5. "How is the backend architecture organized? Monolith or microservices?"
6. "What's the tech stack? Any plans to adopt new technologies?"
7. "How do you handle on-call rotations?"
8. "What's the testing strategy? (unit, integration, e2e)"

### Team/Culture Questions
1. "What does a typical day look like for a backend engineer?"
2. "How large is the team? Frontend vs backend split?"
3. "What's the code review process?"
4. "How does the team balance new features vs maintenance?"
5. "What's the best part about working on this team?"
6. "How do you support professional development?"

### Product/Business Questions
1. "What are the team's top priorities for the next 6 months?"
2. "How does the team measure success?"
3. "Who are the main users/customers?"
4. "What's the biggest product challenge right now?"

### Growth Questions
1. "What does career progression look like for backend engineers?"
2. "Are there opportunities to work on different parts of the stack?"
3. "How do you support learning new technologies?"
4. "What mentorship opportunities exist?"

**Pro tip:** Prepare 2-3 questions for each interview round. Don't ask the same question to multiple interviewers.

---

## 🎯 Last-Minute Review (Read 1 Hour Before Interview)

### Coding Interview Reminders
1. **Clarify before coding:** "Just to confirm, the input is a sorted array?"
2. **Think out loud:** "I'm thinking we could use a hash map here to..."
3. **Start simple:** "Let me start with a brute force approach first"
4. **Test your code:** "Let me walk through an example: [1,2,3]..."
5. **Admit when stuck:** "I'm not sure about this edge case, could you give me a hint?"

### System Design Reminders
1. **Ask about scale:** "How many users? Requests per second?"
2. **State assumptions:** "I'm assuming read-heavy workload, 10:1 ratio"
3. **Draw diagrams:** Visual communication is key
4. **Discuss trade-offs:** "We could use approach A for simplicity or approach B for performance"
5. **Think about failures:** "If the cache goes down, we fall back to the database"

### Behavioral Reminders
1. **Be concise:** 2-3 minutes per answer
2. **Focus on YOUR actions:** Use "I" not "we"
3. **Show growth:** "What I learned from this is..."
4. **Be honest:** Don't exaggerate or lie
5. **Stay positive:** Even when discussing failures or conflicts

### Mental Prep
- You've prepared thoroughly
- You know your patterns
- You have great stories to share
- Not every interview will be perfect, and that's okay
- Focus on showing your thought process, not just getting the right answer
- Be yourself and let your passion for backend engineering shine

**You've got this! 🚀**
