import { View, Text, Linking, TouchableOpacity } from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function SafetyCard() {
  const handleCallCVV = () => {
    Linking.openURL('tel:188');
  };

  const handleOpenCVV = () => {
    Linking.openURL('https://www.cvv.org.br');
  };

  return (
    <Card className="mx-4 my-2 border-destructive bg-destructive/10">
      <CardHeader>
        <CardTitle className="text-destructive">Você não está sozinho</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Text className="text-foreground text-sm">
          Se você está pensando em tirar a própria vida ou se machucar, procure ajuda imediatamente.
        </Text>
        <View className="flex-row gap-2">
          <Button
            onPress={handleCallCVV}
            variant="destructive"
            className="flex-1"
          >
            Ligar CVV (188)
          </Button>
          <Button
            onPress={handleOpenCVV}
            variant="outline"
            className="flex-1"
          >
            Site CVV
          </Button>
        </View>
        <Text className="text-muted-foreground text-xs text-center">
          Centro de Valorização da Vida - 24h, gratuito e anônimo
        </Text>
      </CardContent>
    </Card>
  );
}

