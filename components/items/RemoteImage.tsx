import { memo, useMemo, useState } from "react";
import { ActivityIndicator, Image, Platform, StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from "react-native";
import { Text, useTheme } from "react-native-paper";

type RemoteImageProps = {
  uri: string | null | undefined;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  placeholderText?: string;
  showOverlay?: boolean;
  onLoadError?: () => void;
};

const RemoteImageComponent = ({
  uri,
  style,
  containerStyle,
  placeholderText = "Sin foto",
  showOverlay = true,
  onLoadError,
}: RemoteImageProps) => {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const shouldRenderImage = useMemo(() => Boolean(uri && /^https?:\/\//i.test(uri)), [uri]);
  const imageSource = useMemo(
    () => (Platform.OS === "web" ? { uri: uri ?? undefined } : { uri: uri ?? undefined, cache: "force-cache" as const }),
    [uri],
  );

  if (!shouldRenderImage || hasError) {
    return (
      <View style={[styles.placeholderContainer, { backgroundColor: theme.colors.surfaceVariant }, containerStyle]}>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {placeholderText}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.imageContainer, { backgroundColor: theme.colors.surfaceVariant }, containerStyle]}>
      <Image
        source={imageSource}
        style={[styles.image, style]}
        resizeMode="cover"
        onLoadStart={() => {
          setIsLoading(true);
          setHasError(false);
        }}
        onLoad={() => setIsLoading(false)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
          onLoadError?.();
        }}
      />
      {showOverlay && (isLoading || hasError) && (
        <View style={styles.overlay}>
          {isLoading ? (
            <ActivityIndicator />
          ) : (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              No se pudo cargar
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

export const RemoteImage = memo(RemoteImageComponent);

const styles = StyleSheet.create({
  imageContainer: {
    overflow: "hidden",
    borderRadius: 12,
    position: "relative",
  },
  placeholderContainer: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
