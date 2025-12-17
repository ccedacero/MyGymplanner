const WorkoutSession = require('../db/models/WorkoutSession');

// Sync workout session (create or update)
exports.syncSession = async (req, res) => {
  try {
    const {
      userId,
      planId,
      day,
      sessionDate,
      exercises,
      currentExerciseIndex,
      notes,
      rpe,
      workoutStartTime,
      substitutedExercises,
      lastSyncVersion
    } = req.body;

    // Validate required fields
    if (!userId || !planId || !day || !sessionDate || !exercises || workoutStartTime === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: userId, planId, day, sessionDate, exercises, workoutStartTime'
      });
    }

    try {
      const session = WorkoutSession.upsert({
        userId,
        planId,
        day,
        sessionDate,
        exercises,
        currentExerciseIndex,
        notes,
        rpe,
        workoutStartTime,
        substitutedExercises,
        lastSyncVersion
      });

      res.json({
        success: true,
        session: {
          id: session.id,
          syncVersion: session.syncVersion,
          updatedAt: session.updatedAt
        }
      });
    } catch (error) {
      if (error.message === 'SYNC_CONFLICT') {
        // Return conflict with server's version
        const serverSession = WorkoutSession.findActiveByUserAndWorkout(
          userId,
          planId,
          day,
          sessionDate
        );

        return res.status(409).json({
          error: 'Session was updated by another device',
          conflict: true,
          serverSession: {
            syncVersion: serverSession.syncVersion,
            exercises: serverSession.exercises,
            currentExerciseIndex: serverSession.currentExerciseIndex,
            notes: serverSession.notes,
            rpe: serverSession.rpe,
            workoutStartTime: serverSession.workoutStartTime,
            substitutedExercises: serverSession.substitutedExercises,
            updatedAt: serverSession.updatedAt
          }
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error syncing workout session:', error);
    res.status(500).json({ error: 'Failed to sync workout session' });
  }
};

// Get active session for a user
exports.getActiveSession = async (req, res) => {
  try {
    const { userId } = req.params;

    // Authorization: Verify user can only access their own sessions
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: You can only access your own sessions' });
    }

    const session = WorkoutSession.findActiveByUserId(userId);

    if (!session) {
      return res.json({ hasActiveSession: false });
    }

    res.json({
      hasActiveSession: true,
      session
    });
  } catch (error) {
    console.error('Error fetching active session:', error);
    res.status(500).json({ error: 'Failed to fetch active session' });
  }
};

// Complete a workout session
exports.completeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { duration, notes, rpe } = req.body;

    // Validate required fields
    if (duration === undefined) {
      return res.status(400).json({ error: 'duration is required' });
    }

    const session = WorkoutSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Authorization: Verify user owns this session
    if (session.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden: You can only complete your own workout sessions' });
    }

    if (session.status !== 'in_progress') {
      return res.status(400).json({ error: 'Session is not in progress' });
    }

    const result = WorkoutSession.complete(sessionId, {
      duration,
      notes: notes !== undefined ? notes : session.notes,
      rpe: rpe !== undefined ? rpe : session.rpe
    });

    res.json({
      success: true,
      message: 'Workout completed successfully',
      workoutId: result.workoutId,
      sessionId: result.sessionId
    });
  } catch (error) {
    console.error('Error completing workout session:', error);
    res.status(500).json({ error: 'Failed to complete workout session' });
  }
};

// Abandon/delete a workout session
exports.abandonSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = WorkoutSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Authorization: Verify user owns this session
    if (session.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden: You can only abandon your own workout sessions' });
    }

    const abandoned = WorkoutSession.abandon(sessionId);

    if (!abandoned) {
      return res.status(500).json({ error: 'Failed to abandon session' });
    }

    res.json({
      success: true,
      message: 'Session abandoned successfully'
    });
  } catch (error) {
    console.error('Error abandoning session:', error);
    res.status(500).json({ error: 'Failed to abandon session' });
  }
};

// Get specific session by ID
exports.getSessionById = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = WorkoutSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ session });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
};
