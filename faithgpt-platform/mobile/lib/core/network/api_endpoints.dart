/// API endpoint path constants — see docs/00-shared-reference.md §13.
/// All routes are relative to the base URL, e.g. https://api.faithgpt.app/api/v1.
class ApiEndpoints {
  ApiEndpoints._();

  static const String base = '/api/v1';

  // Auth
  static const String login = '$base/auth/login';
  static const String register = '$base/auth/register';
  static const String refresh = '$base/auth/refresh';
  static const String logout = '$base/auth/logout';

  // Bible
  static const String bibleVersions = '$base/bible/versions';
  static const String bibleBooks = '$base/bible/books';
  static String bibleChapter(String bookId, int chapter) =>
      '$base/bible/books/$bookId/chapters/$chapter';
  static const String bibleSearch = '$base/bible/search';

  // Bible Interactions
  static const String highlights = '$base/highlights';
  static const String notes = '$base/notes';
  static const String bookmarks = '$base/bookmarks';

  // AI Verse-to-Devotion Engine™
  static const String devotions = '$base/devotions';
  static const String devotionGenerate = '$base/devotions/generate';
  static String devotionById(String id) => '$base/devotions/$id';
  static String devotionSectionRegenerate(String id, String sectionKey) =>
      '$base/devotions/$id/sections/$sectionKey/regenerate';

  // AI Bible Study Assistant
  static const String aiConversations = '$base/ai-conversations';
  static String aiConversationMessages(String conversationId) =>
      '$base/ai-conversations/$conversationId/messages';

  // Prayer Generator
  static const String prayers = '$base/prayers';
  static const String prayerGenerate = '$base/prayers/generate';

  // Sermon Studio
  static const String sermons = '$base/sermons';
  static const String sermonGenerate = '$base/sermons/generate';

  // Visual Studio
  static const String imageGenerations = '$base/image-generations';
  static const String storyVisualizations = '$base/story-visualizations';
  static const String memoryVerseCards = '$base/memory-verse-cards';

  // Journal
  static const String journalEntries = '$base/journal-entries';

  // Growth
  static const String streaks = '$base/streaks';
  static const String spiritualStats = '$base/spiritual-stats';
  static const String achievements = '$base/achievements';

  // Community
  static const String communityPosts = '$base/community-posts';
  static const String groups = '$base/groups';
  static const String prayerRequests = '$base/prayer-requests';

  // Account
  static const String profile = '$base/users/me';
  static const String subscription = '$base/subscriptions/me';
  static const String notifications = '$base/notifications';
}
