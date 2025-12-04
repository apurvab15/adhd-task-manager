import sys
from PyQt5.QtWidgets import *
from PyQt5.QtCore import *
from PyQt5.QtGui import *
import json
from datetime import datetime, timedelta

class Task:
    def __init__(self, title, duration=30):
        self.id = datetime.now().timestamp()
        self.title = title
        self.completed = False
        self.progress = 0
        self.duration = duration
        self.steps = []
        self.created = datetime.now()
        self.time_spent = 0

class PomodoroTimer(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.time_left = 25 * 60
        self.duration = 25 * 60
        self.is_running = False
        self.timer = QTimer()
        self.timer.timeout.connect(self.update_timer)
        self.init_ui()
    
    def init_ui(self):
        layout = QVBoxLayout()
        layout.setContentsMargins(20, 20, 20, 20)
        
        # Timer display
        self.time_label = QLabel("25:00")
        self.time_label.setAlignment(Qt.AlignCenter)
        self.time_label.setStyleSheet("""
            font-size: 48px;
            font-weight: bold;
            color: #2c3e50;
            padding: 20px;
        """)
        
        # Progress bar
        self.progress_bar = QProgressBar()
        self.progress_bar.setMaximum(100)
        self.progress_bar.setValue(0)
        self.progress_bar.setTextVisible(False)
        self.progress_bar.setStyleSheet("""
            QProgressBar {
                border: none;
                border-radius: 10px;
                background-color: #e0e0e0;
                height: 20px;
            }
            QProgressBar::chunk {
                border-radius: 10px;
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                    stop:0 #4CAF50, stop:1 #8BC34A);
            }
        """)
        
        # Control buttons
        btn_layout = QHBoxLayout()
        
        self.start_btn = QPushButton("Start Focus")
        self.start_btn.setIcon(self.style().standardIcon(QStyle.SP_MediaPlay))
        self.start_btn.clicked.connect(self.toggle_timer)
        self.start_btn.setStyleSheet(self.get_button_style("#4CAF50"))
        self.start_btn.setMinimumHeight(50)
        
        self.reset_btn = QPushButton("Reset")
        self.reset_btn.clicked.connect(self.reset_timer)
        self.reset_btn.setStyleSheet(self.get_button_style("#607D8B"))
        self.reset_btn.setMinimumHeight(50)
        
        btn_layout.addWidget(self.start_btn)
        btn_layout.addWidget(self.reset_btn)
        
        # Duration selector
        duration_layout = QHBoxLayout()
        duration_label = QLabel("Focus Duration:")
        duration_label.setStyleSheet("font-size: 14px; color: #555;")
        
        self.duration_combo = QComboBox()
        self.duration_combo.addItems(["15 min", "25 min", "45 min", "60 min"])
        self.duration_combo.setCurrentIndex(1)
        self.duration_combo.currentIndexChanged.connect(self.change_duration)
        self.duration_combo.setStyleSheet("""
            QComboBox {
                padding: 8px;
                border: 2px solid #ddd;
                border-radius: 8px;
                font-size: 14px;
                background: white;
            }
        """)
        
        duration_layout.addWidget(duration_label)
        duration_layout.addWidget(self.duration_combo)
        duration_layout.addStretch()
        
        layout.addWidget(self.time_label)
        layout.addWidget(self.progress_bar)
        layout.addLayout(btn_layout)
        layout.addLayout(duration_layout)
        
        self.setLayout(layout)
    
    def get_button_style(self, color):
        return f"""
            QPushButton {{
                background-color: {color};
                color: white;
                border: none;
                border-radius: 10px;
                padding: 12px 24px;
                font-size: 16px;
                font-weight: bold;
            }}
            QPushButton:hover {{
                background-color: {self.adjust_color(color, -20)};
            }}
            QPushButton:pressed {{
                background-color: {self.adjust_color(color, -40)};
            }}
        """
    
    def adjust_color(self, hex_color, amount):
        hex_color = hex_color.lstrip('#')
        r, g, b = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        r = max(0, min(255, r + amount))
        g = max(0, min(255, g + amount))
        b = max(0, min(255, b + amount))
        return f"#{r:02x}{g:02x}{b:02x}"
    
    def toggle_timer(self):
        if self.is_running:
            self.pause_timer()
        else:
            self.start_timer()
    
    def start_timer(self):
        self.is_running = True
        self.timer.start(1000)
        self.start_btn.setText("Pause")
        self.start_btn.setIcon(self.style().standardIcon(QStyle.SP_MediaPause))
    
    def pause_timer(self):
        self.is_running = False
        self.timer.stop()
        self.start_btn.setText("Resume")
        self.start_btn.setIcon(self.style().standardIcon(QStyle.SP_MediaPlay))
    
    def reset_timer(self):
        self.is_running = False
        self.timer.stop()
        self.time_left = self.duration
        self.update_display()
        self.progress_bar.setValue(0)
        self.start_btn.setText("Start Focus")
        self.start_btn.setIcon(self.style().standardIcon(QStyle.SP_MediaPlay))
    
    def update_timer(self):
        self.time_left -= 1
        if self.time_left <= 0:
            self.timer_completed()
        self.update_display()
        progress = ((self.duration - self.time_left) / self.duration) * 100
        self.progress_bar.setValue(int(progress))
    
    def update_display(self):
        minutes = self.time_left // 60
        seconds = self.time_left % 60
        self.time_label.setText(f"{minutes:02d}:{seconds:02d}")
    
    def timer_completed(self):
        self.is_running = False
        self.timer.stop()
        self.time_left = 0
        self.update_display()
        self.progress_bar.setValue(100)
        QMessageBox.information(self, "Focus Complete!", 
            "🎉 Great job! You completed a focus session!\nTime for a break!")
        self.reset_timer()
    
    def change_duration(self, index):
        durations = [15, 25, 45, 60]
        self.duration = durations[index] * 60
        self.reset_timer()

class TaskCard(QWidget):
    task_completed = pyqtSignal(object)
    task_deleted = pyqtSignal(object)
    
    def __init__(self, task, parent=None):
        super().__init__(parent)
        self.task = task
        self.expanded = False
        self.init_ui()
    
    def init_ui(self):
        self.setStyleSheet("""
            TaskCard {
                background-color: white;
                border-radius: 12px;
                border: 2px solid #e0e0e0;
            }
        """)
        
        main_layout = QVBoxLayout()
        main_layout.setContentsMargins(15, 15, 15, 15)
        main_layout.setSpacing(10)
        
        # Header with checkbox and title
        header_layout = QHBoxLayout()
        
        self.checkbox = QCheckBox()
        self.checkbox.setStyleSheet("""
            QCheckBox::indicator {
                width: 24px;
                height: 24px;
                border-radius: 12px;
                border: 3px solid #4CAF50;
            }
            QCheckBox::indicator:checked {
                background-color: #4CAF50;
                image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTkgMTZMMTggN000IDE2TDggMjAiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPgo=);
            }
        """)
        self.checkbox.stateChanged.connect(self.on_checkbox_changed)
        
        self.title_label = QLabel(self.task.title)
        self.title_label.setWordWrap(True)
        self.title_label.setStyleSheet("""
            font-size: 16px;
            font-weight: 600;
            color: #2c3e50;
        """)
        
        self.expand_btn = QPushButton()
        self.expand_btn.setIcon(self.style().standardIcon(QStyle.SP_ArrowDown))
        self.expand_btn.setFlat(True)
        self.expand_btn.setFixedSize(30, 30)
        self.expand_btn.clicked.connect(self.toggle_expand)
        
        self.delete_btn = QPushButton()
        self.delete_btn.setIcon(self.style().standardIcon(QStyle.SP_DialogCloseButton))
        self.delete_btn.setFlat(True)
        self.delete_btn.setFixedSize(30, 30)
        self.delete_btn.clicked.connect(lambda: self.task_deleted.emit(self.task))
        
        header_layout.addWidget(self.checkbox)
        header_layout.addWidget(self.title_label, 1)
        header_layout.addWidget(self.expand_btn)
        header_layout.addWidget(self.delete_btn)
        
        # Progress bar
        self.progress_bar = QProgressBar()
        self.progress_bar.setValue(self.task.progress)
        self.progress_bar.setMaximum(100)
        self.progress_bar.setTextVisible(False)
        self.progress_bar.setFixedHeight(8)
        self.progress_bar.setStyleSheet("""
            QProgressBar {
                border: none;
                border-radius: 4px;
                background-color: #e0e0e0;
            }
            QProgressBar::chunk {
                border-radius: 4px;
                background-color: #4CAF50;
            }
        """)
        
        # Time info
        time_layout = QHBoxLayout()
        self.time_label = QLabel(f"⏱️ {self.task.duration} min")
        self.time_label.setStyleSheet("color: #757575; font-size: 12px;")
        time_layout.addWidget(self.time_label)
        time_layout.addStretch()
        
        # Expandable section
        self.details_widget = QWidget()
        self.details_widget.hide()
        details_layout = QVBoxLayout()
        details_layout.setContentsMargins(0, 10, 0, 0)
        
        # Add steps button
        add_step_btn = QPushButton("+ Add Step")
        add_step_btn.setStyleSheet("""
            QPushButton {
                background-color: #f0f0f0;
                border: 2px dashed #bbb;
                border-radius: 6px;
                padding: 8px;
                color: #666;
                font-size: 13px;
            }
            QPushButton:hover {
                background-color: #e0e0e0;
                border-color: #999;
            }
        """)
        add_step_btn.clicked.connect(self.add_step)
        
        details_layout.addWidget(add_step_btn)
        self.details_widget.setLayout(details_layout)
        
        main_layout.addLayout(header_layout)
        main_layout.addWidget(self.progress_bar)
        main_layout.addLayout(time_layout)
        main_layout.addWidget(self.details_widget)
        
        self.setLayout(main_layout)
    
    def toggle_expand(self):
        self.expanded = not self.expanded
        if self.expanded:
            self.details_widget.show()
            self.expand_btn.setIcon(self.style().standardIcon(QStyle.SP_ArrowUp))
        else:
            self.details_widget.hide()
            self.expand_btn.setIcon(self.style().standardIcon(QStyle.SP_ArrowDown))
    
    def add_step(self):
        text, ok = QInputDialog.getText(self, "Add Step", "Enter step description:")
        if ok and text:
            self.task.steps.append({"text": text, "completed": False})
            # Refresh display
    
    def on_checkbox_changed(self, state):
        if state == Qt.Checked:
            self.task.completed = True
            self.task.progress = 100
            self.progress_bar.setValue(100)
            self.title_label.setStyleSheet("""
                font-size: 16px;
                font-weight: 600;
                color: #999;
                text-decoration: line-through;
            """)
            QTimer.singleShot(500, lambda: self.task_completed.emit(self.task))

class ADHDTaskManager(QMainWindow):
    def __init__(self):
        super().__init__()
        self.tasks = []
        self.focus_mode = False
        self.points = 0
        self.streak = 0
        self.init_ui()
    
    def init_ui(self):
        self.setWindowTitle("ADHD Task Manager - Focus & Achieve")
        self.setMinimumSize(1000, 700)
        
        # Apply global stylesheet
        self.setStyleSheet("""
            QMainWindow {
                background-color: #E8F5E9;
            }
            QWidget {
                font-family: 'Segoe UI', Arial, sans-serif;
            }
        """)
        
        # Central widget
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        main_layout = QVBoxLayout()
        main_layout.setContentsMargins(20, 20, 20, 20)
        main_layout.setSpacing(20)
        
        # Top bar with actions
        top_bar = self.create_top_bar()
        main_layout.addWidget(top_bar)
        
        # Main content area with splitter
        splitter = QSplitter(Qt.Horizontal)
        
        # Left panel - Tasks
        left_panel = self.create_left_panel()
        splitter.addWidget(left_panel)
        
        # Right panel - Timer and stats
        right_panel = self.create_right_panel()
        splitter.addWidget(right_panel)
        
        splitter.setStretchFactor(0, 2)
        splitter.setStretchFactor(1, 1)
        
        main_layout.addWidget(splitter)
        
        central_widget.setLayout(main_layout)
        
        # Status bar
        self.statusBar().showMessage("Ready to focus! 🎯")
        self.statusBar().setStyleSheet("""
            QStatusBar {
                background-color: white;
                color: #555;
                font-size: 13px;
                border-top: 2px solid #ddd;
            }
        """)
    
    def create_top_bar(self):
        top_widget = QWidget()
        top_widget.setStyleSheet("""
            QWidget {
                background-color: white;
                border-radius: 12px;
                padding: 10px;
            }
        """)
        
        layout = QHBoxLayout()
        layout.setContentsMargins(15, 15, 15, 15)
        
        # Add task button
        add_task_btn = QPushButton("+ Add Task")
        add_task_btn.setStyleSheet("""
            QPushButton {
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 10px;
                padding: 12px 24px;
                font-size: 15px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
        """)
        add_task_btn.clicked.connect(self.add_task)
        
        # Focus mode toggle
        focus_btn = QPushButton("🎯 Focus Mode")
        focus_btn.setCheckable(True)
        focus_btn.setStyleSheet("""
            QPushButton {
                background-color: #2196F3;
                color: white;
                border: none;
                border-radius: 10px;
                padding: 12px 24px;
                font-size: 15px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #0b7dda;
            }
            QPushButton:checked {
                background-color: #FF9800;
            }
        """)
        focus_btn.clicked.connect(self.toggle_focus_mode)
        
        # Stats display
        self.stats_label = QLabel(f"🏆 Points: {self.points}  🔥 Streak: {self.streak} days")
        self.stats_label.setStyleSheet("""
            font-size: 15px;
            font-weight: bold;
            color: #FF5722;
            padding: 10px;
        """)
        
        layout.addWidget(add_task_btn)
        layout.addWidget(focus_btn)
        layout.addStretch()
        layout.addWidget(self.stats_label)
        
        top_widget.setLayout(layout)
        return top_widget
    
    def create_left_panel(self):
        panel = QWidget()
        panel.setStyleSheet("""
            QWidget {
                background-color: transparent;
            }
        """)
        
        layout = QVBoxLayout()
        layout.setContentsMargins(0, 0, 0, 0)
        
        # Header
        header = QLabel("START A NEW PROJECT")
        header.setAlignment(Qt.AlignCenter)
        header.setStyleSheet("""
            background-color: white;
            border-radius: 12px;
            padding: 20px;
            font-size: 18px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        """)
        layout.addWidget(header)
        
        # Scroll area for tasks
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setStyleSheet("""
            QScrollArea {
                border: none;
                background-color: transparent;
            }
        """)
        
        self.tasks_container = QWidget()
        self.tasks_layout = QVBoxLayout()
        self.tasks_layout.setSpacing(15)
        self.tasks_layout.addStretch()
        self.tasks_container.setLayout(self.tasks_layout)
        
        scroll.setWidget(self.tasks_container)
        layout.addWidget(scroll)
        
        # Calm down section
        calm_btn = QPushButton("Need to calm down?")
        calm_btn.setStyleSheet("""
            QPushButton {
                background-color: white;
                border-radius: 12px;
                padding: 15px;
                font-size: 14px;
                color: #555;
                border: 2px solid #ddd;
            }
            QPushButton:hover {
                background-color: #f5f5f5;
                border-color: #4CAF50;
            }
        """)
        calm_btn.clicked.connect(self.show_calm_down)
        layout.addWidget(calm_btn)
        
        panel.setLayout(layout)
        return panel
    
    def create_right_panel(self):
        panel = QWidget()
        panel.setStyleSheet("""
            QWidget {
                background-color: white;
                border-radius: 12px;
            }
        """)
        
        layout = QVBoxLayout()
        layout.setContentsMargins(0, 0, 0, 0)
        
        # Timer
        self.pomodoro_timer = PomodoroTimer()
        layout.addWidget(self.pomodoro_timer)
        
        # Stats and motivation
        stats_widget = QWidget()
        stats_layout = QVBoxLayout()
        stats_layout.setContentsMargins(20, 20, 20, 20)
        
        motivation_label = QLabel("💪 Keep Going!")
        motivation_label.setAlignment(Qt.AlignCenter)
        motivation_label.setStyleSheet("""
            font-size: 20px;
            font-weight: bold;
            color: #FF5722;
            padding: 15px;
        """)
        
        tips_label = QLabel(
            "✨ Tips for Success:\n\n"
            "• Break tasks into small steps\n"
            "• Take breaks between focus sessions\n"
            "• Celebrate small wins\n"
            "• One task at a time"
        )
        tips_label.setStyleSheet("""
            font-size: 13px;
            color: #666;
            line-height: 1.6;
            padding: 10px;
            background-color: #f9f9f9;
            border-radius: 8px;
        """)
        
        stats_layout.addWidget(motivation_label)
        stats_layout.addWidget(tips_label)
        stats_layout.addStretch()
        
        stats_widget.setLayout(stats_layout)
        layout.addWidget(stats_widget)
        
        panel.setLayout(layout)
        return panel
    
    def add_task(self):
        dialog = QDialog(self)
        dialog.setWindowTitle("Add New Task")
        dialog.setModal(True)
        dialog.setMinimumWidth(400)
        
        layout = QVBoxLayout()
        layout.setSpacing(15)
        
        # Title input
        title_label = QLabel("Task Title:")
        title_label.setStyleSheet("font-size: 14px; font-weight: bold;")
        title_input = QLineEdit()
        title_input.setPlaceholderText("What do you need to do?")
        title_input.setStyleSheet("""
            QLineEdit {
                padding: 12px;
                border: 2px solid #ddd;
                border-radius: 8px;
                font-size: 14px;
            }
            QLineEdit:focus {
                border-color: #4CAF50;
            }
        """)
        
        # Duration input
        duration_label = QLabel("Estimated Duration (minutes):")
        duration_label.setStyleSheet("font-size: 14px; font-weight: bold;")
        duration_spin = QSpinBox()
        duration_spin.setRange(5, 240)
        duration_spin.setValue(30)
        duration_spin.setSuffix(" min")
        duration_spin.setStyleSheet("""
            QSpinBox {
                padding: 10px;
                border: 2px solid #ddd;
                border-radius: 8px;
                font-size: 14px;
            }
        """)
        
        # Buttons
        button_layout = QHBoxLayout()
        
        add_btn = QPushButton("Add Task")
        add_btn.setStyleSheet("""
            QPushButton {
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 12px 24px;
                font-size: 14px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
        """)
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.setStyleSheet("""
            QPushButton {
                background-color: #f0f0f0;
                color: #666;
                border: none;
                border-radius: 8px;
                padding: 12px 24px;
                font-size: 14px;
            }
            QPushButton:hover {
                background-color: #e0e0e0;
            }
        """)
        
        button_layout.addWidget(cancel_btn)
        button_layout.addWidget(add_btn)
        
        layout.addWidget(title_label)
        layout.addWidget(title_input)
        layout.addWidget(duration_label)
        layout.addWidget(duration_spin)
        layout.addLayout(button_layout)
        
        dialog.setLayout(layout)
        
        def on_add():
            title = title_input.text().strip()
            if title:
                task = Task(title, duration_spin.value())
                self.tasks.insert(0, task)
                self.add_task_card(task)
                dialog.accept()
                self.statusBar().showMessage(f"✅ Task added: {title}", 3000)
        
        add_btn.clicked.connect(on_add)
        cancel_btn.clicked.connect(dialog.reject)
        title_input.returnPressed.connect(on_add)
        
        dialog.exec_()
    
    def add_task_card(self, task):
        card = TaskCard(task)
        card.task_completed.connect(self.on_task_completed)
        card.task_deleted.connect(self.on_task_deleted)
        
        # Insert at the beginning (before stretch)
        self.tasks_layout.insertWidget(0, card)
    
    def on_task_completed(self, task):
        self.points += 10
        self.streak += 1
        self.update_stats()
        
        msg = QMessageBox(self)
        msg.setWindowTitle("Task Completed! 🎉")
        msg.setText(f"Great job! You earned 10 points!\n\nTotal Points: {self.points}")
        msg.setIcon(QMessageBox.Information)
        msg.setStyleSheet("""
            QMessageBox {
                background-color: white;
            }
            QLabel {
                font-size: 14px;
                color: #333;
            }
        """)
        msg.exec_()
    
    def on_task_deleted(self, task):
        if task in self.tasks:
            self.tasks.remove(task)
        
        # Find and remove the card
        for i in range(self.tasks_layout.count()):
            widget = self.tasks_layout.itemAt(i).widget()
            if isinstance(widget, TaskCard) and widget.task == task:
                widget.deleteLater()
                break
        
        self.statusBar().showMessage("Task deleted", 2000)
    
    def toggle_focus_mode(self, checked):
        self.focus_mode = checked
        if checked:
            self.statusBar().showMessage("🎯 Focus Mode ON - Minimize distractions!")
            # Could implement hiding non-essential UI elements
        else:
            self.statusBar().showMessage("Focus Mode OFF")
    
    def update_stats(self):
        self.stats_label.setText(f"🏆 Points: {self.points}  🔥 Streak: {self.streak} days")
    
    def show_calm_down(self):
        dialog = QDialog(self)
        dialog.setWindowTitle("Calm Down Exercises")
        dialog.setModal(True)
        dialog.setMinimumSize(500, 400)
        
        layout = QVBoxLayout()
        
        title = QLabel("🧘 Take a Moment to Breathe")
        title.setAlignment(Qt.AlignCenter)
        title.setStyleSheet("font-size: 20px; font-weight: bold; padding: 20px;")
        
        text = QLabel(
            "Try these calming techniques:\n\n"
            "🌬️ Box Breathing:\n"
            "Breathe in for 4 counts\n"
            "Hold for 4 counts\n"
            "Breathe out for 4 counts\n"
            "Hold for 4 counts\n"
            "Repeat 4 times\n\n"
            "🧠 5-4-3-2-1 Grounding:\n"
            "Name 5 things you can see\n"
            "4 things you can touch\n"
            "3 things you can hear\n"
            "2 things you can smell\n"
            "1 thing you can taste"
        )
        text.setStyleSheet("""
            font-size: 14px;
            line-height: 1.8;
            padding: 20px;
            background-color: #f0f8ff;
            border-radius: 10px;
        """)
        text.setWordWrap(True)
        
        close_btn = QPushButton("Close")
        close_btn.clicked.connect(dialog.accept)
        close_btn.setStyleSheet("""
            QPushButton {
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 12px 24px;
                font-size: 14px;
                font-weight: bold;
            }
        """)
        
        layout.addWidget(title)
        layout.addWidget(text)
        layout.addWidget(close_btn)
        
        dialog.setLayout(layout)
        dialog.exec_()

def main():
    app = QApplication(sys.argv)
    
    # Set application-wide font
    font = QFont("Segoe UI", 10)
    app.setFont(font)
    
    window = ADHDTaskManager()
    window.show()
    
    sys.exit(app.exec_())

if __name__ == '__main__':
    main()