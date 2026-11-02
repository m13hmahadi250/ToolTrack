export interface CodeTemplate {
  id: string;
  name: string;
  description: string;
  language: 'python' | 'cpp' | 'c';
  code: string;
  defaultStdin?: string;
}

export const COMPILER_TEMPLATES: CodeTemplate[] = [
  // --- PYTHON 3 TEMPLATES ---
  {
    id: 'py-hello-world',
    name: 'Hello World (Minimal)',
    description: 'Instantaneous execution with standard print function.',
    language: 'python',
    code: `print("Hello World")`,
  },
  {
    id: 'py-data-science',
    name: 'Pandas & NumPy Data Science',
    description: 'Load datasets, compute aggregations, and perform vectorized mathematical transformations.',
    language: 'python',
    code: `import pandas as pd
import numpy as np

# 1. Generate realistic data
np.random.seed(42)
data = {
    'Department': ['Engineering', 'Marketing', 'Sales', 'Design', 'Engineering', 'Sales'],
    'Experience_Years': [2, 5, 3, 4, 8, 6],
    'Salary_USD': [75000, 68000, 82000, 71000, 115000, 94000],
    'Performance_Score': [4.5, 4.2, 4.8, 4.1, 4.9, 4.4]
}

# 2. Create Pandas DataFrame
df = pd.DataFrame(data)
print("=== ToolTrack DataFrame Overview ===")
print(df)
print("\\n=== Department Group Aggregations ===")
dept_summary = df.groupby('Department')[['Salary_USD', 'Performance_Score']].mean()
print(dept_summary)

# 3. NumPy Vectorized Operations
salaries = df['Salary_USD'].values
print("\\n=== NumPy Statistical Metrics ===")
print(f"Mean Salary:   \${np.mean(salaries):,.2f}")
print(f"Median Salary: \${np.median(salaries):,.2f}")
print(f"Std Deviation: \${np.std(salaries):,.2f}")
`,
  },
  {
    id: 'py-scikit-learn',
    name: 'Scikit-Learn Machine Learning',
    description: 'Feature scaling, train/test split, regression model training, and prediction evaluation.',
    language: 'python',
    code: `import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score

# 1. Synthesize training features (e.g., Study Hours & Practice Tests -> Exam Score)
np.random.seed(42)
X = np.random.uniform(1.0, 10.0, (100, 2))
# Ground truth formula: Score = 15*X1 + 5*X2 + noise
y = 15 * X[:, 0] + 5 * X[:, 1] + np.random.normal(0, 3.5, 100)

# 2. Train-Test Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 3. Feature Scaling
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 4. Train Linear Regression Model
model = LinearRegression()
model.fit(X_train_scaled, y_train)

# 5. Evaluate Predictions
y_pred = model.predict(X_test_scaled)
mse = mean_squared_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print("=== ToolTrack Scikit-Learn Model Trained ===")
print(f"Test Mean Squared Error (MSE): {mse:.3f}")
print(f"Coefficient of Determination (R² Score): {r2:.3f}")
print("\\nSample Predictions vs Actual:")
for actual, pred in zip(y_test[:5], y_pred[:5]):
    print(f"  Actual: {actual:6.2f}  |  Predicted: {pred:6.2f}  |  Delta: {abs(actual - pred):5.2f}")
`,
  },
  {
    id: 'py-matplotlib',
    name: 'Matplotlib Data Visualization',
    description: 'Generate high-resolution line plots and histograms with styling and auto-display.',
    language: 'python',
    code: `import numpy as np
import matplotlib.pyplot as plt

# 1. Generate mathematical curve
x = np.linspace(0, 4 * np.pi, 200)
y_sin = np.sin(x)
y_cos = np.cos(x)

# 2. Plotting with Matplotlib
plt.figure(figsize=(9, 4.5), dpi=150)
plt.plot(x, y_sin, label='Sine Wave sin(x)', color='#2563eb', linewidth=2.5)
plt.plot(x, y_cos, label='Cosine Wave cos(x)', color='#ec4899', linewidth=2.0, linestyle='--')

plt.title('ToolTrack Python Visualization Studio', fontsize=14, fontweight='bold', pad=12)
plt.xlabel('Angle (Radians)', fontsize=11)
plt.ylabel('Amplitude', fontsize=11)
plt.grid(True, linestyle=':', alpha=0.6)
plt.legend(loc='upper right', frameon=True)
plt.tight_layout()

# Call show() to export figure into the Visualization panel
plt.show()
print("Figure rendered successfully! Check the 'Plots / Visualizations' tab.")
`,
  },
  {
    id: 'py-interactive-io',
    name: 'Interactive Input & Algorithms',
    description: 'Accept standard input (stdin) lines, parse arrays, and compute Fibonacci sequences.',
    language: 'python',
    defaultStdin: 'Alice Bob Charlie\n5\n10 25 30 45 50',
    code: `import sys

print("=== ToolTrack Interactive Python ===")

# Read multiple lines from standard input (stdin)
names_line = input("Enter student names (space separated): ")
students = names_line.split()

n = int(input("Enter number of scores: "))
scores = list(map(int, input(f"Enter {n} scores: ").split()))

print(f"\\nProcessed {len(students)} student names: {students}")
print(f"Scores recorded: {scores}")
print(f"Highest Score:  {max(scores)}")
print(f"Average Score:  {sum(scores) / len(scores):.2f}")

# Fibonacci generator
def fib(count):
    a, b = 0, 1
    for _ in range(count):
        yield a
        a, b = b, a + b

print(f"\\nFirst 8 Fibonacci numbers: {list(fib(8))}")
`,
  },

  // --- C++ TEMPLATES ---
  {
    id: 'cpp-hello-world',
    name: 'Hello World (Minimal)',
    description: 'Minimal C++ starter using iostream and std::cout.',
    language: 'cpp',
    code: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello World" << endl;
    return 0;
}`,
  },
  {
    id: 'cpp-stdcxx',
    name: 'Competitive Programming (<bits/stdc++.h>)',
    description: 'Fast I/O, vector manipulation, binary search, and STL algorithms using GCC/G++.',
    language: 'cpp',
    defaultStdin: '6\n15 3 98 42 7 64',
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Fast I/O
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    if (!(cin >> n)) {
        n = 5;
    }

    vector<int> nums(n);
    for (int i = 0; i < n; i++) {
        if (!(cin >> nums[i])) {
            nums[i] = (i + 1) * 10;
        }
    }

    cout << "=== ToolTrack C++ STL Engine ===" << "\\n";
    cout << "Original Array: ";
    for (int x : nums) cout << x << " ";
    cout << "\\n";

    // STL Sort and Accumulate
    sort(nums.begin(), nums.end());
    long long total = accumulate(nums.begin(), nums.end(), 0LL);

    cout << "Sorted Array:   ";
    for (int x : nums) cout << x << " ";
    cout << "\\n";
    cout << "Sum: " << total << " | Average: " << fixed << setprecision(2) << (double)total / n << "\\n";

    return 0;
}
`,
  },
  {
    id: 'cpp-classes',
    name: 'Modern C++ OOP & Templates',
    description: 'Object-oriented programming, constructors, encapsulation, and modern C++20 features.',
    language: 'cpp',
    code: `#include <iostream>
#include <vector>
#include <string>
#include <memory>

class Student {
private:
    std::string name;
    int id;
    double gpa;

public:
    Student(std::string n, int i, double g) : name(n), id(i), gpa(g) {}

    void display() const {
        std::cout << "Student ID: " << id << " | Name: " << name 
                  << " | GPA: " << gpa << std::endl;
    }

    double getGpa() const { return gpa; }
};

int main() {
    std::cout << "=== ToolTrack C++ Object-Oriented Demo ===" << std::endl;

    std::vector<Student> roster = {
        Student("Mohammad", 101, 3.95),
        Student("Sarah", 102, 3.88),
        Student("David", 103, 3.72)
    };

    double gpaSum = 0;
    for (const auto& s : roster) {
        s.display();
        gpaSum += s.getGpa();
    }

    std::cout << "\\nClass Average GPA: " << (gpaSum / roster.size()) << std::endl;
    return 0;
}
`,
  },

  // --- C TEMPLATES ---
  {
    id: 'c-hello-world',
    name: 'Hello World (Minimal)',
    description: 'Standard C starter with printf and stdio.h.',
    language: 'c',
    code: `#include <stdio.h>

int main() {
    printf("Hello World\\n");
    return 0;
}`,
  },
  {
    id: 'c-stdio',
    name: 'Standard C17 Console Program',
    description: 'Standard library headers, scanf/printf, mathematical routines, and memory layout.',
    language: 'c',
    defaultStdin: '25 10',
    code: `#include <stdio.h>
#include <stdlib.h>
#include <math.h>

int main(void) {
    int a = 0, b = 0;

    printf("=== ToolTrack C Compiler (GCC 12) ===\\n");
    printf("Please enter two numbers: ");

    if (scanf("%d %d", &a, &b) != 2) {
        a = 25;
        b = 10;
        printf("(Using defaults: %d, %d)\\n", a, b);
    }

    int sum = a + b;
    int product = a * b;
    double hypotenuse = sqrt((double)(a * a + b * b));

    printf("\\nResults:\\n");
    printf("Sum:         %d + %d = %d\\n", a, b, sum);
    printf("Product:     %d * %d = %d\\n", a, b, product);
    printf("Hypotenuse:  sqrt(%d^2 + %d^2) = %.2f\\n", a, b, hypotenuse);

    return 0;
}
`,
  },
  {
    id: 'c-pointers',
    name: 'C Pointers & Dynamic Allocation',
    description: 'Dynamic memory allocation with malloc/free, pointer arithmetic, and bubble sort.',
    language: 'c',
    code: `#include <stdio.h>
#include <stdlib.h>

void bubbleSort(int *arr, int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (*(arr + j) > *(arr + j + 1)) {
                int temp = *(arr + j);
                *(arr + j) = *(arr + j + 1);
                *(arr + j + 1) = temp;
            }
        }
    }
}

int main(void) {
    int n = 6;
    int *arr = (int *)malloc(n * sizeof(int));
    if (!arr) {
        fprintf(stderr, "Memory allocation error\\n");
        return 1;
    }

    int initialValues[] = {45, 12, 89, 23, 7, 56};
    for (int i = 0; i < n; i++) {
        arr[i] = initialValues[i];
    }

    printf("=== ToolTrack Dynamic Memory & Pointers ===\\n");
    printf("Original array: ");
    for (int i = 0; i < n; i++) printf("%d ", *(arr + i));
    printf("\\n");

    bubbleSort(arr, n);

    printf("Sorted array:   ");
    for (int i = 0; i < n; i++) printf("%d ", *(arr + i));
    printf("\\n");

    free(arr);
    printf("Memory freed successfully.\\n");
    return 0;
}
`,
  },
];
