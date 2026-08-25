import HabitLog from "../models/HabitLog.js";
import Habit from "../models/Habit.js";
import {
  todayKey,
  last90Days,
  calcStreak,
} from "../utils/dateHelpers.js";

/**
 * Mark a habit as completed
 */
export const markComplete = async (req, res) => {
  try {
    const { habitId, date } = req.body;

    if (!habitId) {
      return res.status(400).json({
        message: "habitId is required",
      });
    }

    const completedDate = date || todayKey();

    const habit = await Habit.findOne({
      _id: habitId,
      userId: req.user._id,
    });

    if (!habit) {
      return res.status(404).json({
        message: "Habit not found",
      });
    }

    const log = await HabitLog.findOneAndUpdate(
      {
        userId: req.user._id,
        habitId,
        completedDate,
      },
      {
        $setOnInsert: {
          userId: req.user._id,
          habitId,
          completedDate,
        },
      },
      {
        upsert: true,
        new: true,
      }
    );

    res.status(201).json({
      message: "Habit marked complete",
      log,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/**
 * Remove completion for a habit
 */
export const unmarkComplete = async (req, res) => {
  try {
    const { habitId, date } = req.body;

    if (!habitId) {
      return res.status(400).json({
        message: "habitId is required",
      });
    }

    const completedDate = date || todayKey();

    await HabitLog.findOneAndDelete({
      userId: req.user._id,
      habitId,
      completedDate,
    });

    res.json({
      message: "Habit unmarked successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

export const getToday = async (req,res) => {
   try {
      const logs = await HabitLog.find({
         userId: req.user._id,
         completedDate: todayKey(),
      })
      res.json(logs)
   } catch (err) {
      res.status(500).json({message: err.message});
   }
}

/**
 * Get logs within a date range
 */
export const getRange = async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        message: "start and end are required",
      });
    }

    const logs = await HabitLog.find({
      userId: req.user._id,
      completedDate: {
        $gte: start,
        $lte: end,
      },
    }).sort({
      completedDate: -1,
    });

    res.json(logs);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/**
 * Heatmap data for last 90 days
 */
export const getHeatmap = async (req, res) => {
  try {
    const days = last90Days();

    const logs = await HabitLog.find({
      userId: req.user._id,
      completedDate: {
        $gte: days[0],
        $lte: days[days.length - 1],
      },
    });

    const counts = {};

    for (const day of days) {
      counts[day] = 0;
    }

    for (const log of logs) {
      counts[log.completedDate] =
        (counts[log.completedDate] || 0) + 1;
    }

    const data = days.map((day) => ({
      date: day,
      count: counts[day] || 0,
    }));

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/**
 * Statistics for one habit
 */
export const getHabitStats = async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.habitId,
      userId: req.user._id,
    });

    if (!habit) {
      return res.status(404).json({
        message: "Habit not found",
      });
    }

    const logs = await HabitLog.find({
      userId: req.user._id,
      habitId: habit._id,
    }).sort({
      completedDate: -1,
    });

    const dateKeys = logs.map((log) => log.completedDate);

    const { current, longest } = calcStreak(dateKeys);

    const createdKey = habit.createdAt
      .toISOString()
      .slice(0, 10);

    const start = new Date(createdKey);
    const end = new Date(todayKey());

    const totalDays =
      Math.max(
        1,
        Math.floor(
          (end - start) / (1000 * 60 * 60 * 24)
        )
      ) + 1;

    const uniqueDays = new Set(
      logs.map((log) => log.completedDate)
    );

    const completionRate = Math.round(
      (uniqueDays.size / totalDays) * 100
    );

    const monthly = {};

    for (const log of logs) {
      const month = log.completedDate.slice(0, 7);
      monthly[month] = (monthly[month] || 0) + 1;
    }

    res.json({
      habit,
      totalCompletions: logs.length,
      currentStreak: current,
      longestStreak: longest,
      completionRate,
      monthly,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/**
 * Statistics for all habits
 */
export const getAllStats = async (req, res) => {
  try {
    const habits = await Habit.find({
      userId: req.user._id,
      isArchived: false,
    });

    const days = last90Days();

    const logs = await HabitLog.find({
      userId: req.user._id,
      completedDate: {
        $gte: days[0],
        $lte: days[days.length - 1],
      },
    });

    const perHabit = habits.map((habit) => {
      const habitLogs = logs.filter(
        (log) =>
          String(log.habitId) === String(habit._id)
      );

      const dateKeys = habitLogs
        .map((log) => log.completedDate)
        .sort((a, b) => b.localeCompare(a));

      const { current, longest } = calcStreak(dateKeys);

      return {
        habitId: habit._id,
        name: habit.name,
        icon: habit.icon,
        color: habit.color,
        category: habit.category,
        completions90d: habitLogs.length,
        currentStreak: current,
        longestStreak: longest,
      };
    });

    res.json({
      perHabit,
      days,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};