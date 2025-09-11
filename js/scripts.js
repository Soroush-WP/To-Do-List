/* Complete JavaScript rewrite for modern UI with enhanced features and animations */
/* global jQuery, bootstrap */

document.addEventListener("DOMContentLoaded", () => {
  const $ = window.jQuery || window.$
  const bootstrap = window.bootstrap

  // App State
  let tasks = JSON.parse(localStorage.getItem("taskmaster_tasks")) || []
  let currentFilter = "all"
  let currentCategory = "all"
  let currentView = localStorage.getItem("taskmaster_view") || "list"
  let isAdvancedPanelOpen = false

  function initializeApp() {
    updateAllCounters()
    renderTasks()
    setupEventListeners()
    setupKeyboardShortcuts()

    // Add entrance animations
    $(".app-sidebar").addClass("fade-in")
    $(".app-content").addClass("slide-up")

    // Focus on task input
    setTimeout(() => {
      $("#taskInput").focus()
    }, 500)

    // Initialize with sample tasks if empty
    if (tasks.length === 0) {
      createSampleTasks()
    }
  }

  function setupEventListeners() {
    // Quick task input with enhanced animations
    $("#taskInput").on("keypress", function (e) {
      if (e.which === 13 && !e.shiftKey) {
        e.preventDefault()
        const title = $(this).val().trim()
        if (title) {
          addQuickTask(title)
          $(this).val("").blur().focus()

          // Add success animation to input
          $(this).addClass("pulse")
          setTimeout(() => $(this).removeClass("pulse"), 600)
        }
      }
    })

    $("#addTaskBtn").on("click", () => {
      const title = $("#taskInput").val().trim()
      if (title) {
        addQuickTask(title)
        $("#taskInput").val("").focus()
      } else {
        // Shake animation for empty input
        $("#taskInput").addClass("shake").focus()
        setTimeout(() => $("#taskInput").removeClass("shake"), 500)
      }
    })

    // Advanced panel toggle with smooth animations
    $("#advancedBtn, #createFirstTask").on("click", () => {
      toggleAdvancedPanel(true)
    })

    $("#closeAdvanced, #cancelAdvanced").on("click", () => {
      toggleAdvancedPanel(false)
    })

    // Advanced form submission
    $("#advancedForm").on("submit", function (e) {
      e.preventDefault()

      const task = {
        id: Date.now() + Math.random(),
        title: $("#advancedTitle").val().trim(),
        description: $("#advancedDescription").val().trim(),
        category: $("#advancedCategory").val(),
        priority: $("#advancedPriority").val(),
        dueDate: $("#advancedDate").val(),
        time: $("#advancedTime").val(),
        completed: false,
        createdAt: new Date().toISOString(),
      }

      if (task.title) {
        tasks.unshift(task)
        saveTasks()
        updateAllCounters()
        renderTasks()

        // Reset form and close panel
        this.reset()
        toggleAdvancedPanel(false)

        showToast("Task created successfully! 🎉", "success")

        // Animate new task
        setTimeout(() => {
          $(".task-item:first").addClass("bounce-in")
        }, 100)
      }
    })

    // Enhanced search with real-time filtering
    $("#searchInput").on("input", function () {
      const value = $(this).val().trim()
      $("#clearSearch").toggle(value.length > 0)
      renderTasks()

      // Add search animation
      if (value) {
        $(this).addClass("searching")
      } else {
        $(this).removeClass("searching")
      }
    })

    $("#clearSearch").on("click", () => {
      $("#searchInput").val("").trigger("input").focus()
    })

    // Enhanced filter buttons with smooth transitions
    $(".filter-item").on("click", function () {
      if (!$(this).hasClass("active")) {
        $(".filter-item").removeClass("active")
        $(this).addClass("active")
        currentFilter = $(this).data("filter")
        updateSectionTitle()
        renderTasks()

        // Add selection animation
        $(this).addClass("bounce-in")
        setTimeout(() => $(this).removeClass("bounce-in"), 600)
      }
    })

    // Enhanced category buttons
    $(".category-item").on("click", function () {
      if (!$(this).hasClass("active")) {
        $(".category-item").removeClass("active")
        $(this).addClass("active")
        currentCategory = $(this).data("category")
        updateSectionTitle()
        renderTasks()

        // Add selection animation
        $(this).addClass("bounce-in")
        setTimeout(() => $(this).removeClass("bounce-in"), 600)
      }
    })

    // Enhanced stat cards with click functionality
    $(".stat-card").on("click", function () {
      const filter = $(this).data("filter")
      if (filter) {
        $(`.filter-item[data-filter="${filter}"]`).click()
      }
    })

    // Sort functionality
    $("#sortSelect").on("change", () => {
      renderTasks()
    })

    // View toggle
    $(".view-btn").on("click", function () {
      $(".view-btn").removeClass("active")
      $(this).addClass("active")
      currentView = $(this).data("view")
      localStorage.setItem("taskmaster_view", currentView)
      renderTasks()
    })

    // Clear completed tasks
    $("#clearCompleted").on("click", () => {
      const completedTasks = tasks.filter((task) => task.completed)

      if (completedTasks.length === 0) {
        showToast("No completed tasks to clear! 📝", "info")
        return
      }

      if (confirm(`Delete ${completedTasks.length} completed task(s)?`)) {
        tasks = tasks.filter((task) => !task.completed)
        saveTasks()
        updateAllCounters()
        renderTasks()
        showToast(`${completedTasks.length} completed task(s) deleted! 🗑️`, "success")
      }
    })

    // Task actions (event delegation)
    $(document).on("change", ".task-checkbox", function () {
      const taskId = $(this).closest(".task-item").data("task-id")
      const task = tasks.find((t) => t.id == taskId)

      if (task) {
        task.completed = $(this).is(":checked")
        saveTasks()
        updateAllCounters()

        const taskItem = $(this).closest(".task-item")
        if (task.completed) {
          taskItem.addClass("completed")
          showToast("Task completed! Great job! 🎉", "success")
        } else {
          taskItem.removeClass("completed")
          showToast("Task marked as pending 📝", "info")
        }

        // Smooth re-render after animation
        setTimeout(() => renderTasks(), 300)
      }
    })

    $(document).on("click", ".delete-task", function () {
      const taskId = $(this).closest(".task-item").data("task-id")
      const task = tasks.find((t) => t.id == taskId)

      if (task && confirm("Delete this task permanently?")) {
        // Add delete animation
        const taskItem = $(this).closest(".task-item")
        taskItem.addClass("fade-out")

        setTimeout(() => {
          tasks = tasks.filter((t) => t.id != taskId)
          saveTasks()
          updateAllCounters()
          renderTasks()
          showToast("Task deleted successfully! 🗑️", "success")
        }, 300)
      }
    })
  }

  function setupKeyboardShortcuts() {
    $(document).on("keydown", (e) => {
      // Ctrl/Cmd + Enter to submit forms
      if ((e.ctrlKey || e.metaKey) && e.keyCode === 13) {
        if ($("#advancedPanel").hasClass("active")) {
          $("#advancedForm").submit()
        }
      }

      // Escape key actions
      if (e.keyCode === 27) {
        if (isAdvancedPanelOpen) {
          toggleAdvancedPanel(false)
        } else if ($("#searchInput").val()) {
          $("#clearSearch").click()
        }
      }

      // Ctrl/Cmd + N for new task
      if ((e.ctrlKey || e.metaKey) && e.keyCode === 78) {
        e.preventDefault()
        if (!isAdvancedPanelOpen) {
          toggleAdvancedPanel(true)
        }
      }

      // Ctrl/Cmd + F for search
      if ((e.ctrlKey || e.metaKey) && e.keyCode === 70) {
        e.preventDefault()
        $("#searchInput").focus()
      }
    })
  }

  function addQuickTask(title) {
    const task = {
      id: Date.now() + Math.random(),
      title: title,
      description: "",
      category: "personal",
      priority: "medium",
      dueDate: "",
      time: "",
      completed: false,
      createdAt: new Date().toISOString(),
    }

    tasks.unshift(task)
    saveTasks()
    updateAllCounters()
    renderTasks()

    showToast("Quick task added! ⚡", "success")

    // Animate new task
    setTimeout(() => {
      $(".task-item:first").addClass("bounce-in")
    }, 100)
  }

  function toggleAdvancedPanel(show) {
    const panel = $("#advancedPanel")

    if (show && !isAdvancedPanelOpen) {
      panel.addClass("active")
      isAdvancedPanelOpen = true
      setTimeout(() => $("#advancedTitle").focus(), 300)
    } else if (!show && isAdvancedPanelOpen) {
      panel.removeClass("active")
      isAdvancedPanelOpen = false
      $("#advancedForm")[0].reset()
    }
  }

  function updateAllCounters() {
    updateNavCounters()
    updateStatCards()
    updateFilterBadges()
    updateCategoryBadges()
    updateProgressRing()
  }

  function updateNavCounters() {
    const total = tasks.length
    const completed = tasks.filter((task) => task.completed).length

    $("#totalCount").text(total)
    $("#completedCount").text(completed)
  }

  function updateStatCards() {
    const total = tasks.length
    const completed = tasks.filter((task) => task.completed).length
    const pending = total - completed
    const overdue = getOverdueTasks().length

    $("#allTasks").text(total)
    $("#doneTasks").text(completed)
    $("#pendingTasks").text(pending)
    $("#overdueTasks").text(overdue)
  }

  function updateFilterBadges() {
    const total = tasks.length
    const today = getTodayTasks().length
    const high = tasks.filter((task) => task.priority === "high").length

    $("#badgeAll").text(total)
    $("#badgeToday").text(today)
    $("#badgeHigh").text(high)
  }

  function updateCategoryBadges() {
    const all = tasks.length
    const work = tasks.filter((task) => task.category === "work").length
    const personal = tasks.filter((task) => task.category === "personal").length
    const shopping = tasks.filter((task) => task.category === "shopping").length
    const health = tasks.filter((task) => task.category === "health").length

    $("#catAll").text(all)
    $("#catWork").text(work)
    $("#catPersonal").text(personal)
    $("#catShopping").text(shopping)
    $("#catHealth").text(health)
  }

  function updateProgressRing() {
    const total = tasks.length
    const completed = tasks.filter((task) => task.completed).length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    const progressBar = document.getElementById("progressBar")
    const circumference = 2 * Math.PI * 18 // radius = 18
    const offset = circumference - (percentage / 100) * circumference

    progressBar.style.strokeDasharray = circumference
    progressBar.style.strokeDashoffset = offset

    $("#progressValue").text(`${percentage}%`)
  }

  function updateSectionTitle() {
    let title = "All Tasks"

    if (currentFilter !== "all") {
      const filterTitles = {
        completed: "Completed Tasks",
        pending: "Pending Tasks",
        overdue: "Overdue Tasks",
        today: "Due Today",
        high: "High Priority Tasks",
      }
      title = filterTitles[currentFilter] || title
    }

    if (currentCategory !== "all") {
      const categoryTitles = {
        work: "Work Tasks",
        personal: "Personal Tasks",
        shopping: "Shopping Tasks",
        health: "Health Tasks",
      }
      title = categoryTitles[currentCategory] || title
    }

    $("#sectionTitle").text(title)
  }

  function renderTasks() {
    let filteredTasks = [...tasks]

    // Apply search filter
    const searchTerm = $("#searchInput").val().toLowerCase().trim()
    if (searchTerm) {
      filteredTasks = filteredTasks.filter(
        (task) => task.title.toLowerCase().includes(searchTerm) || task.description.toLowerCase().includes(searchTerm),
      )
    }

    // Apply status filters
    if (currentFilter === "completed") {
      filteredTasks = filteredTasks.filter((task) => task.completed)
    } else if (currentFilter === "pending") {
      filteredTasks = filteredTasks.filter((task) => !task.completed)
    } else if (currentFilter === "overdue") {
      filteredTasks = getOverdueTasks()
    } else if (currentFilter === "today") {
      filteredTasks = getTodayTasks()
    } else if (currentFilter === "high") {
      filteredTasks = filteredTasks.filter((task) => task.priority === "high")
    }

    // Apply category filter
    if (currentCategory !== "all") {
      filteredTasks = filteredTasks.filter((task) => task.category === currentCategory)
    }

    // Apply sorting
    const sortBy = $("#sortSelect").val()
    filteredTasks.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt)
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        case "dueDate":
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate) - new Date(b.dueDate)
        case "alphabetical":
          return a.title.localeCompare(b.title)
        default: // newest
          return new Date(b.createdAt) - new Date(a.createdAt)
      }
    })

    const container = $("#tasksContainer")

    if (filteredTasks.length === 0) {
      container.html(getEmptyStateHTML())
      return
    }

    const tasksHTML = filteredTasks.map((task) => createTaskHTML(task)).join("")
    container.html(tasksHTML)

    // Add staggered entrance animations
    $(".task-item").each((index, element) => {
      setTimeout(() => {
        $(element).addClass("fade-in")
      }, index * 50)
    })
  }

  function createTaskHTML(task) {
    const dueInfo = getDueInfo(task.dueDate, task.time)
    const categoryInfo = getCategoryInfo(task.category)
    const priorityInfo = getPriorityInfo(task.priority)

    return `
      <div class="task-item ${task.completed ? "completed" : ""} priority-${task.priority}" data-task-id="${task.id}">
        <div class="task-content">
          <div class="task-header">
            <div class="task-checkbox-wrapper">
              <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""} id="task-${task.id}">
              <label for="task-${task.id}" class="checkbox-label"></label>
            </div>
            
            <div class="task-info">
              <h5 class="task-title">${escapeHtml(task.title)}</h5>
              ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ""}
              
              <div class="task-meta">
                <span class="task-badge priority-${task.priority}">
                  <span class="priority-dot"></span>
                  ${priorityInfo.label}
                </span>
                
                <span class="task-badge category-${task.category}">
                  <span class="category-dot" style="background: ${categoryInfo.color}"></span>
                  ${categoryInfo.name}
                </span>
                
                ${dueInfo.html}
              </div>
            </div>
          </div>
          
          <div class="task-actions">
            <button class="action-btn delete-task" title="Delete Task">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <polyline points="3,6 5,6 21,6" stroke="currentColor" stroke-width="2"/>
                <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `
  }

  function getEmptyStateHTML() {
    return `
      <div class="empty-state fade-in" id="emptyState">
        <div class="empty-illustration">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="1.5"/>
            <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="1.5"/>
            <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="1.5"/>
            <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="1.5"/>
            <polyline points="10,9 9,10 7,8" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        </div>
        <h3>No tasks found!</h3>
        <p>Create your first task to get started on your productivity journey.</p>
        <button type="button" id="createFirstTask" class="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2"/>
            <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2"/>
          </svg>
          Create First Task
        </button>
      </div>
    `
  }

  function getDueInfo(dueDate, time) {
    if (!dueDate) return { html: "", class: "" }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    const diffTime = due - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    let className = ""
    let text = ""
    let icon = ""

    if (diffDays < 0) {
      className = "overdue"
      text = `Overdue (${Math.abs(diffDays)} days)`
      icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2"/>
        <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2"/>
      </svg>`
    } else if (diffDays === 0) {
      className = "today"
      text = "Due Today"
      icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <polyline points="12,6 12,12 16,14" stroke="currentColor" stroke-width="2"/>
      </svg>`
    } else if (diffDays === 1) {
      text = "Due Tomorrow"
      icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
        <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2"/>
        <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2"/>
        <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2"/>
      </svg>`
    } else {
      text = `Due in ${diffDays} days`
      icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
        <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2"/>
        <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2"/>
        <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2"/>
      </svg>`
    }

    if (time) {
      text += ` at ${time}`
    }

    return {
      html: `<span class="task-badge due-date ${className}">${icon} ${text}</span>`,
      class: className,
    }
  }

  function getCategoryInfo(category) {
    const categories = {
      work: { name: "Work", color: "#3b82f6" },
      personal: { name: "Personal", color: "#10b981" },
      shopping: { name: "Shopping", color: "#f59e0b" },
      health: { name: "Health", color: "#ef4444" },
    }
    return categories[category] || { name: category, color: "#6b7280" }
  }

  function getPriorityInfo(priority) {
    const priorities = {
      high: { label: "High", color: "#ef4444" },
      medium: { label: "Medium", color: "#f59e0b" },
      low: { label: "Low", color: "#10b981" },
    }
    return priorities[priority] || { label: priority, color: "#6b7280" }
  }

  function getTodayTasks() {
    const today = new Date().toISOString().split("T")[0]
    return tasks.filter((task) => task.dueDate === today)
  }

  function getOverdueTasks() {
    const today = new Date().toISOString().split("T")[0]
    return tasks.filter((task) => task.dueDate && task.dueDate < today && !task.completed)
  }

  function escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }

  function saveTasks() {
    localStorage.setItem("taskmaster_tasks", JSON.stringify(tasks))
  }

  function showToast(message, type = "info") {
    const toastId = "toast-" + Date.now()
    const iconMap = {
      success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <polyline points="20,6 9,17 4,12" stroke="currentColor" stroke-width="2"/>
      </svg>`,
      error: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/>
        <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
      </svg>`,
      info: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <line x1="12" y1="16" x2="12" y2="12" stroke="currentColor" stroke-width="2"/>
        <line x1="12" y1="8" x2="12.01" y2="8" stroke="currentColor" stroke-width="2"/>
      </svg>`,
    }

    const toast = $(`
      <div class="toast ${type}" id="${toastId}">
        <div class="toast-icon">${iconMap[type] || iconMap.info}</div>
        <div class="toast-message">${message}</div>
        <button class="toast-close" onclick="$('#${toastId}').removeClass('show')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
      </div>
    `)

    $("#toastContainer").append(toast)

    // Show toast with animation
    setTimeout(() => toast.addClass("show"), 100)

    // Auto-hide after 4 seconds
    setTimeout(() => {
      toast.removeClass("show")
      setTimeout(() => toast.remove(), 300)
    }, 4000)
  }

  function createSampleTasks() {
    const sampleTasks = [
      {
        id: Date.now() + 1,
        title: "Welcome to TaskMaster! 🎉",
        description: "This is your new productivity companion. You can complete or delete this task to get started.",
        category: "personal",
        priority: "medium",
        dueDate: new Date().toISOString().split("T")[0],
        time: "09:00",
        completed: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: Date.now() + 2,
        title: "Complete quarterly presentation",
        description: "Prepare slides for the Q4 review meeting with stakeholders",
        category: "work",
        priority: "high",
        dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        time: "14:00",
        completed: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: Date.now() + 3,
        title: "Buy groceries",
        description: "Milk, bread, eggs, fruits, vegetables",
        category: "shopping",
        priority: "low",
        dueDate: "",
        time: "",
        completed: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ]

    tasks = sampleTasks
    saveTasks()
  }

  // Initialize the app
  initializeApp()
})
