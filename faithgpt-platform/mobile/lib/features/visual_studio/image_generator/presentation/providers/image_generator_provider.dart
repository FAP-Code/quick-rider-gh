import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'image_generator_provider.g.dart';

/// Placeholder state for the AI Scripture Image Generator™ (docs/02 §1.3) — STUB.
class ImageGeneratorState {
  const ImageGeneratorState();
}

@riverpod
class ImageGenerator extends _$ImageGenerator {
  @override
  Future<ImageGeneratorState> build() async => const ImageGeneratorState();
}
