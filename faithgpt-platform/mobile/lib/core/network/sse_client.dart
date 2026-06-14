import 'dart:convert';

/// A single parsed Server-Sent-Event frame: `event: <type>` + `data: <payload>`.
///
/// Mirrors the `section` / `done` / `error` event types emitted by AI
/// generation endpoints (devotions/prayers/sermons/AI Study chat) — see
/// docs/09-api-architecture.md §6.
class SseEvent {
  const SseEvent({required this.event, required this.data});

  final String event;
  final String data;

  Map<String, dynamic> get json => jsonDecode(data) as Map<String, dynamic>;
}

/// Buffers raw SSE byte/text chunks (as emitted by [ApiClient.streamSse]) and
/// yields one [SseEvent] per `\n\n`-delimited frame.
class SseClient {
  SseClient._();

  static Stream<SseEvent> parse(Stream<String> rawChunks) async* {
    var buffer = '';
    await for (final chunk in rawChunks) {
      buffer += chunk;
      while (buffer.contains('\n\n')) {
        final frameEnd = buffer.indexOf('\n\n');
        final frame = buffer.substring(0, frameEnd);
        buffer = buffer.substring(frameEnd + 2);

        var event = 'message';
        final dataLines = <String>[];
        for (final line in frame.split('\n')) {
          if (line.startsWith('event:')) {
            event = line.substring(6).trim();
          } else if (line.startsWith('data:')) {
            dataLines.add(line.substring(5).trim());
          }
        }
        if (dataLines.isNotEmpty) {
          yield SseEvent(event: event, data: dataLines.join('\n'));
        }
      }
    }
  }
}
