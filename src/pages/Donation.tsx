import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, Coffee, Gift, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Donation = () => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const donationTiers = [
    {
      amount: 5,
      icon: Coffee,
      title: "Café",
      description: "Un café para el desarrollador",
      badge: "Básico"
    },
    {
      amount: 15,
      icon: Heart,
      title: "Apoyo Médico",
      description: "Ayuda al desarrollo médico",
      badge: "Popular",
      popular: true
    },
    {
      amount: 30,
      icon: Star,
      title: "Contribuidor VIP",
      description: "Acceso prioritario a nuevas funciones",
      badge: "VIP"
    },
    {
      amount: 50,
      icon: Gift,
      title: "Mecenas Médico",
      description: "Apoyo completo al proyecto",
      badge: "Premium"
    }
  ];

  const handleDonation = async () => {
    if (!selectedAmount) return;
    
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "¡Donación exitosa!",
        description: `Gracias por tu donación de $${selectedAmount}. Tu acceso ha sido activado.`,
      });
      navigate("/calculator");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          
          <div className="bg-gradient-primary p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <Heart className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-foreground">Apoya MediCalc Voice</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Tu donación nos ayuda a mantener y mejorar esta herramienta médica gratuita para profesionales de la salud.
          </p>
        </div>

        {/* Mission Statement */}
        <Card className="shadow-medical">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold mb-3">Nuestra Misión</h3>
            <p className="text-sm text-muted-foreground">
              Democratizar el acceso a herramientas médicas precisas y rápidas, 
              utilizando tecnología de voz para mejorar la eficiencia en el cuidado médico.
            </p>
          </CardContent>
        </Card>

        {/* Donation Tiers */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-center">Elige tu Contribución</h2>
          
          <div className="grid gap-4">
            {donationTiers.map((tier) => (
              <Card 
                key={tier.amount}
                className={`cursor-pointer transition-all shadow-medical ${
                  selectedAmount === tier.amount 
                    ? 'ring-2 ring-primary shadow-glow' 
                    : 'hover:shadow-lg'
                } ${tier.popular ? 'border-primary' : ''}`}
                onClick={() => setSelectedAmount(tier.amount)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-primary p-2 rounded-lg">
                        <tier.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">${tier.amount}</h3>
                          <Badge variant={tier.popular ? "default" : "secondary"}>
                            {tier.badge}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">{tier.title}</p>
                        <p className="text-xs text-muted-foreground">{tier.description}</p>
                      </div>
                    </div>
                    
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedAmount === tier.amount
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground'
                    }`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <Card className="shadow-medical">
          <CardHeader>
            <CardTitle className="text-center">¿Qué Obtienes?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-medical-green rounded-full" />
                <span>Acceso completo a todas las calculadoras médicas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-medical-green rounded-full" />
                <span>Reconocimiento de voz avanzado en español</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-medical-green rounded-full" />
                <span>Síntesis de voz para resultados</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-medical-green rounded-full" />
                <span>Fórmulas y cálculos detallados</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-medical-green rounded-full" />
                <span>Apoyas el desarrollo de nuevas funciones</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        {selectedAmount && (
          <Button
            onClick={handleDonation}
            disabled={isProcessing}
            variant="medical"
            size="xl"
            className="w-full"
          >
            {isProcessing 
              ? "Procesando donación..." 
              : `Donar $${selectedAmount} y Acceder`
            }
          </Button>
        )}

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Esta es una aplicación educativa. No reemplaza el juicio clínico profesional.
          </p>
          <p className="text-xs text-muted-foreground">
            Los pagos son procesados de forma segura.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Donation;