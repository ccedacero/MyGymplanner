const API_BASE = import.meta.env.VITE_API_URL || '/api'

let accessTokenGetter = null;
let refreshTokenHandler = null;

// Allow auth context to inject token getter
export const setAccessTokenGetter = (getter) => {
  accessTokenGetter = getter;
};

export const setRefreshTokenHandler = (handler) => {
  refreshTokenHandler = handler;
};

const getHeaders = async () => {
  let token = null;

  if (accessTokenGetter) {
    token = accessTokenGetter();
  } else {
    // Fallback to old method for backward compatibility
    token = localStorage.getItem('token');
  }

  const sessionId = localStorage.getItem('sessionId');

  console.log('[API] Getting headers - token exists:', !!token, 'sessionId exists:', !!sessionId);

  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(sessionId && { 'X-Session-Id': sessionId })
  };
};

// Helper to handle fetch with auto-retry on 401
const fetchWithRetry = async (url, options, retryCount = 0) => {
  const headers = await getHeaders();
  const response = await fetch(url, {
    ...options,
    headers: { ...headers, ...options.headers }
  });

  // If 401 and we have a refresh handler, try to refresh once
  if (response.status === 401 && refreshTokenHandler && retryCount === 0) {
    const refreshed = await refreshTokenHandler();

    if (refreshed) {
      // Retry with new token
      return fetchWithRetry(url, options, retryCount + 1);
    }
  }

  return response;
};

// Auth endpoints
export const refreshToken = async (refreshToken, sessionId) => {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken, sessionId })
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to refresh token');
  }
  return res.json();
};

export const getSessions = async (userId) => {
  const res = await fetchWithRetry(`${API_BASE}/auth/sessions/${userId}`, {
    method: 'GET'
  });
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json();
};

export const revokeSession = async (sessionId) => {
  const res = await fetchWithRetry(`${API_BASE}/auth/sessions/${sessionId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to revoke session');
  return res.json();
};

export const revokeAllOtherSessions = async (userId) => {
  const res = await fetchWithRetry(`${API_BASE}/auth/sessions/${userId}/revoke-others`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to revoke sessions');
  return res.json();
};

export const logout = async (sessionId) => {
  const res = await fetch(`${API_BASE}/users/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId })
  });
  if (!res.ok) throw new Error('Logout failed');
  return res.json();
};

// Users
export const register = async (email, password, name) => {
  const res = await fetch(`${API_BASE}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name })
  });
  if (!res.ok) {
    const errorData = await res.json();
    if (errorData.requirements && errorData.requirements.length > 0) {
      throw new Error(`${errorData.error}:\n• ${errorData.requirements.join('\n• ')}`);
    }
    throw new Error(errorData.error || 'Registration failed');
  }
  return res.json();
};

export const login = async (email, password) => {
  const res = await fetch(`${API_BASE}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Login failed');
  }
  return res.json();
}

export const updateEquipment = async (userId, equipment) => {
  console.log('[updateEquipment] Called with userId:', userId, 'equipment:', equipment);
  const res = await fetchWithRetry(`${API_BASE}/users/${userId}/equipment`, {
    method: 'PUT',
    body: JSON.stringify({ equipment })
  });
  console.log('[updateEquipment] Response status:', res.status, res.ok ? 'OK' : 'FAILED');
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Failed to update equipment' }));
    const errorMessage = errorData.details || errorData.error || 'Failed to update equipment';
    console.error('[updateEquipment] Error:', errorMessage, 'Status:', res.status);
    const error = new Error(errorMessage);
    error.status = res.status;
    throw error;
  }
  return res.json();
};

export const updateExercisePreference = async (userId, exercisePreference) => {
  const res = await fetchWithRetry(`${API_BASE}/users/${userId}/exercise-preference`, {
    method: 'PUT',
    body: JSON.stringify({ exercisePreference })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Failed to update exercise preference' }));
    const errorMessage = errorData.details || errorData.error || 'Failed to update exercise preference';
    throw new Error(errorMessage);
  }
  return res.json();
};

// Exercises
export const getExercises = async (userId, equipment) => {
  let url = `${API_BASE}/exercises?userId=${userId}`
  if (equipment) url += `&equipment=${equipment.join(',')}`

  const res = await fetchWithRetry(url, {
    method: 'GET'
  });
  if (!res.ok) throw new Error('Failed to fetch exercises');
  return res.json();
};

export const uploadExercises = async (userId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);

  const headers = await getHeaders();
  const { 'Content-Type': _, ...headersWithoutContentType } = headers;

  const res = await fetch(`${API_BASE}/exercises/upload`, {
    method: 'POST',
    headers: headersWithoutContentType,
    body: formData
  });
  if (!res.ok) throw new Error('Failed to upload exercises');
  return res.json();
};

export const getExerciseSubstitutes = async (exerciseId, userId, equipment) => {
  let url = `${API_BASE}/exercises/${exerciseId}/substitutes?userId=${userId}`
  if (equipment) url += `&equipment=${equipment.join(',')}`

  const res = await fetchWithRetry(url, {
    method: 'GET'
  });
  if (!res.ok) throw new Error('Failed to fetch exercise substitutes');
  return res.json();
};

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

// Workout Sessions
export const syncWorkoutSession = async (sessionData) => {
  const res = await fetch(`${API_BASE}/workout-sessions/sync`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(sessionData)
  })
  if (!res.ok) {
    if (res.status === 409) {
      // Conflict - return the error data with server session
      const errorData = await res.json()
      const error = new Error(errorData.error)
      error.conflict = true
      error.serverSession = errorData.serverSession
      throw error
    }
    throw new Error('Failed to sync workout session')
  }
  return res.json()
}

export const getActiveSession = async (userId) => {
  const res = await fetch(`${API_BASE}/workout-sessions/active/${userId}`, {
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Failed to fetch active session')
  return res.json()
}

export const completeWorkoutSession = async (sessionId, data) => {
  const res = await fetch(`${API_BASE}/workout-sessions/${sessionId}/complete`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to complete workout session')
  return res.json()
}

export const abandonSession = async (sessionId) => {
  const res = await fetch(`${API_BASE}/workout-sessions/${sessionId}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Failed to abandon session')
  return res.json()
}
