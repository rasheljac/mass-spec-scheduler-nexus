
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "../../hooks/use-toast";
import { Button } from "../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { useAuth } from "../../contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type FormValues = z.infer<typeof formSchema>;

const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const { toast: hookToast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  // Pre-fill form for development/testing purposes
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      form.setValue('email', 'eddy@kapelczak.com');
      form.setValue('password', 'Eddie#12');
    }
  }, [form]);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      console.log("Attempting login with:", values.email);
      const success = await login(values.email, values.password);
      console.log("Login success:", success);
      
      if (success) {
        toast.success("Login successful! Welcome back to the Mass Spec Lab");
        
        // Explicitly navigate to dashboard after successful login with a slight delay
        // to allow authentication state to update fully
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 100);
      } else {
        // Login failure is handled in the AuthContext
        console.log("Login failed in form component");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error instanceof Error ? error.message : "Please check your credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="your.email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-full" type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              Logging in...
            </>
          ) : "Login"}
        </Button>
      </form>
    </Form>
  );
};

export default LoginForm;
