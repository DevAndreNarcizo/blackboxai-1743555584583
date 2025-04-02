// Task Model
class Task {
    constructor(id, title, description, dueDate, completed = false) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.completed = completed;
    }
}

// TaskManager - Similar to TaskDB.pas in Delphi version
class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    addTask(title, description, dueDate) {
        const task = new Task(
            Date.now(),
            title,
            description,
            dueDate
        );
        this.tasks.push(task);
        this.saveTasks();
        return task;
    }

    updateTask(id, updates) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            Object.assign(task, updates);
            this.saveTasks();
            return true;
        }
        return false;
    }

    deleteTask(id) {
        const index = this.tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            this.tasks.splice(index, 1);
            this.saveTasks();
            return true;
        }
        return false;
    }

    getAllTasks() {
        return this.tasks;
    }
}

// NotificationManager - Similar to NotificationManager.pas in Delphi version
class NotificationManager {
    static show(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        
        notification.className = `mb-4 p-4 rounded-lg text-white ${
            type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' :
            'bg-blue-500'
        }`;
        
        notification.textContent = message;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Main Application
class TodoApp {
    constructor() {
        this.taskManager = new TaskManager();
        this.initializeApp();
    }

    initializeApp() {
        // Initialize form submission
        const form = document.getElementById('taskForm');
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Load initial tasks
        this.renderTasks();

        // Check for due tasks every minute
        setInterval(() => this.checkDueTasks(), 60000);
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const dateInput = document.getElementById('taskDate').value;
        const timeInput = document.getElementById('taskTime').value;

        if (!title) {
            NotificationManager.show('Por favor, insira um título para a tarefa', 'error');
            return;
        }

        if (!dateInput) {
            NotificationManager.show('Por favor, selecione uma data', 'error');
            return;
        }

        if (!timeInput) {
            NotificationManager.show('Por favor, selecione um horário', 'error');
            return;
        }

        try {
            // Validate and combine date and time inputs
            if (!dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
                NotificationManager.show('Formato de data inválido. Use AAAA-MM-DD', 'error');
                return;
            }
            
            if (!timeInput.match(/^\d{2}:\d{2}$/)) {
                NotificationManager.show('Formato de hora inválido. Use HH:MM', 'error');
                return;
            }

            const dueDateInput = `${dateInput}T${timeInput}`;
            const dueDate = new Date(dueDateInput);
            const now = new Date();
            
            if (isNaN(dueDate.getTime())) {
                NotificationManager.show('Data ou hora inválida', 'error');
                return;
            }
            
            if (dueDate < now) {
                NotificationManager.show('A data de vencimento deve ser no futuro', 'error');
                return;
            }

            const task = this.taskManager.addTask(title, description, dueDateInput);
            this.renderTasks();
            NotificationManager.show('Tarefa adicionada com sucesso!', 'success');
            
            // Clear form
            e.target.reset();
        } catch (error) {
            console.error('Error adding task:', error);
            NotificationManager.show('Erro ao adicionar tarefa', 'error');
        }
    }

    renderTasks() {
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = '';
        
        const tasks = this.taskManager.getAllTasks();
        
        if (tasks.length === 0) {
            taskList.innerHTML = `
                <div class="text-center text-gray-500">
                    Nenhuma tarefa encontrada
                </div>
            `;
            return;
        }

        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = `p-4 bg-gray-50 rounded-lg shadow ${task.completed ? 'opacity-70' : ''}`;
            
            taskElement.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <input type="checkbox" 
                               ${task.completed ? 'checked' : ''} 
                               class="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                               onchange="app.toggleTask(${task.id})">
                        <div>
                            <h3 class="font-medium ${task.completed ? 'line-through text-gray-500' : ''}">${task.title}</h3>
                            ${task.description ? `<p class="text-sm text-gray-600">${task.description}</p>` : ''}
                            ${task.dueDate ? `<p class="text-xs text-gray-500">Vencimento: ${new Date(task.dueDate).toLocaleString()}</p>` : ''}
                        </div>
                    </div>
                    <button onclick="app.deleteTask(${task.id})" 
                            class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            taskList.appendChild(taskElement);
        });
    }

    toggleTask(id) {
        const task = this.taskManager.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.taskManager.updateTask(id, { completed: task.completed });
            this.renderTasks();
            NotificationManager.show(
                task.completed ? 'Tarefa concluída!' : 'Tarefa reaberta!',
                'success'
            );
        }
    }

    deleteTask(id) {
        if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
            if (this.taskManager.deleteTask(id)) {
                this.renderTasks();
                NotificationManager.show('Tarefa excluída com sucesso!', 'success');
            } else {
                NotificationManager.show('Erro ao excluir tarefa', 'error');
            }
        }
    }

    checkDueTasks() {
        const now = new Date();
        this.taskManager.tasks.forEach(task => {
            if (task.dueDate && !task.completed) {
                const dueDate = new Date(task.dueDate);
                if (dueDate <= now) {
                    NotificationManager.show(`Tarefa vencida: ${task.title}`, 'error');
                }
            }
        });
    }
}

// Initialize the application
const app = new TodoApp();