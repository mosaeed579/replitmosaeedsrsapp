package com.medstudy.app

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import android.app.PendingIntent

class StudyStatsWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onEnabled(context: Context) {
        // Widget added for the first time
    }

    override fun onDisabled(context: Context) {
        // Last widget removed
    }

    companion object {
        private const val CAPACITOR_PREFS = "CapacitorStorage"
        
        internal fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.widget_study_stats)
            
            // Get data from Capacitor SharedPreferences
            val prefs = context.getSharedPreferences(CAPACITOR_PREFS, Context.MODE_PRIVATE)
            val totalLessons = prefs.getString("MedStudyWidget_total_lessons", "0")?.toIntOrNull() ?: 0
            val completedLessons = prefs.getString("MedStudyWidget_completed_lessons", "0")?.toIntOrNull() ?: 0
            val studyStreak = prefs.getString("MedStudyWidget_study_streak", "0")?.toIntOrNull() ?: 0
            
            views.setTextViewText(R.id.widget_total_lessons, totalLessons.toString())
            views.setTextViewText(R.id.widget_completed, completedLessons.toString())
            views.setTextViewText(R.id.widget_streak, studyStreak.toString())
            
            // Create intent to open app when widget is clicked
            val intent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                val pendingIntent = PendingIntent.getActivity(
                    context,
                    0,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_title, pendingIntent)
            }
            
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
