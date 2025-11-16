import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import { ErrorOutline as ErrorIcon } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              backgroundColor: '#fff',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <ErrorIcon
                sx={{
                  fontSize: 80,
                  color: 'error.main',
                }}
              />

              <Typography variant="h4" component="h1" gutterBottom>
                Oops! Something went wrong
              </Typography>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                We apologize for the inconvenience. An unexpected error has occurred.
              </Typography>

              {this.state.error && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    backgroundColor: '#f5f5f5',
                    width: '100%',
                    maxWidth: 600,
                    textAlign: 'left',
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    color="error"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    Error Details:
                  </Typography>
                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      color: 'text.secondary',
                    }}
                  >
                    {this.state.error.message}
                  </Typography>

                  {import.meta.env.DEV && this.state.errorInfo && (
                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="subtitle2"
                        color="error"
                        gutterBottom
                        sx={{ fontWeight: 600 }}
                      >
                        Component Stack:
                      </Typography>
                      <Typography
                        variant="body2"
                        component="pre"
                        sx={{
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          color: 'text.secondary',
                          maxHeight: 200,
                          overflow: 'auto',
                        }}
                      >
                        {this.state.errorInfo.componentStack}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              )}

              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={this.handleReset}
                  size="large"
                >
                  Try Again
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => window.location.href = '/'}
                  size="large"
                >
                  Go to Homepage
                </Button>
              </Box>
            </Box>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}
