const API_BASE = import.meta.env.VITE_API_URL || '/api'

const getHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

// Users
export const register = async (email, password, name) => {
  const res = await fetch(`${API_BASE}/users/register`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, password, name })
  })
  if (!res.ok) {
    const errorData = await res.json()
    if (errorData.requirements && errorData.requirements.length > 0) {
      throw new Error(`${errorData.error}:\n• ${errorData.requirements.join('\n• ')}`)
    }
    throw new Error(errorData.error || 'Registration failed')
  }
  return res.json()
}

export const login = async (email, password) => {
  const res = await fetch(`${API_BASE}/users/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, password })
  })
  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.error || 'Login failed')
  }
  return res.json()
}

export const updateEquipment = async (userId, equipment) => {
  const res = await fetch(`${API_BASE}/users/${userId}/equipment`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ equipment })
  })
  if (!res.ok) throw new Error('Failed to update equipment')
  return res.json()
}

export const updateExercisePreference = async (userId, exercisePreference) => {
  const res = await fetch(`${API_BASE}/users/${userId}/exercise-preference`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ exercisePreference })
  })
  if (!res.ok) throw new Error('Failed to update exercise preference')
  return res.json()
}

// Exercises
export const getExercises = async (userId, equipment) => {
  let url = `${API_BASE}/exercises?userId=${userId}`
  if (equipment) url += `&equipment=${equipment.join(',')}`

  const res = await fetch(url, {
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Failed to fetch exercises')
  return res.json()
}

export const uploadExercises = async (userId, file) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('userId', userId)

  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}/exercises/upload`, {
    method: 'POST',
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: formData
  })
  if (!res.ok) throw new Error('Failed to upload exercises')
  return res.json()
}

export const getExerciseSubstitutes = async (exerciseId, userId, equipment) => {
  let url = `${API_BASE}/exercises/${exerciseId}/substitutes?userId=${userId}`
  if (equipment) url += `&equipment=${equipment.join(',')}`

  const res = await fetch(url, {
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Failed to fetch exercise substitutes')
  return res.json()
}

// Stretches
export const getStretches = async (targetArea, difficulty, type) => {
  let url = `${API_BASE}/exercises/stretches/all`
  const params = []
  if (targetArea) params.push(`targetArea=${targetArea}`)
  if (difficulty) params.push(`difficulty=${difficulty}`)
  if (type) params.push(`type=${type}`)
  if (params.length > 0) url += `?${params.join('&')}`

  const res = await fetch(url, {
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Failed to fetch stretches')
  return res.json()
}

export const getStretchById = async (stretchId) => {
  const res = await fetch(`${API_BASE}/exercises/stretches/${stretchId}`, {
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Failed to fetch stretch')
  return res.json()
}

// Plans
export const generatePlan = async (config) => {
  const res = await fetch(`${API_BASE}/plans/generate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(config)
  })
  if (!res.ok) throw new Error('Failed to generate plan')
  return res.json()
}

export const getUserPlans = async (userId) => {
  const res = await fetch(`${API_BASE}/plans/user/${userId}`, {
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Failed to fetch plans')
  return res.json()
}

export const getPlanById = async (planId) => {
  const res = await fetch(`${API_BASE}/plans/${planId}`, {
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Failed to fetch plan')
  return res.json()
}

export const updatePlan = async (planId, updates) => {
  const res = await fetch(`${API_BASE}/plans/${planId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(updates)
  })
  if (!res.ok) throw new Error('Failed to update plan')
  return res.json()
}

// Workouts
export const logWorkout = async (workoutData) => {
  const res = await fetch(`${API_BASE}/workouts/log`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(workoutData)
  })
  if (!res.ok) throw new Error('Failed to log workout')
  return res.json()
}

export const getUserWorkouts = async (userId, limit) => {
  let url = `${API_BASE}/workouts/user/${userId}`
  if (limit) url += `?limit=${limit}`

  const res = await fetch(url, {
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Failed to fetch workouts')
  return res.json()
}

export const getTodaysWorkout = async (planId) => {
  const res = await fetch(`${API_BASE}/workouts/today/${planId}`, {
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('No workout scheduled for today')
  return res.json()
}

export const getWorkoutStats = async (userId, period = 'month') => {
  const res = await fetch(`${API_BASE}/workouts/stats/${userId}?period=${period}`, {
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export const getLastExerciseWorkout = async (userId, exerciseId) => {
  const res = await fetch(`${API_BASE}/workouts/last/${userId}/${exerciseId}`, {
    headers: getHeaders()
  })
  if (!res.ok) {
    if (res.status === 404) return null // No previous workout
    throw new Error('Failed to fetch last exercise workout')
  }
  return res.json()
}
