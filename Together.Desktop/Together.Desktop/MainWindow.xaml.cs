using System.Diagnostics;
using System.IO;
using System.Windows;
using System.Windows.Forms;
using System.Windows.Input;
using Microsoft.Web.WebView2.Core;
using Application = System.Windows.Application;

namespace Together.Desktop;

public partial class MainWindow : Window
{
    private static readonly string AppUrl = "https://together-friends.duckdns.org:8443";
    private NotifyIcon? _trayIcon;

    public MainWindow()
    {
        InitializeComponent();
        Loaded += OnWindowLoaded;
        Closing += OnWindowClosing;
        StateChanged += OnWindowStateChanged;
        TitleBar.MouseLeftButtonDown += OnTitleBarMouseDown;
        InitTrayIcon();
    }

    private void InitTrayIcon()
    {
        _trayIcon = new NotifyIcon
        {
            Text = "Together",
            Visible = true,
            Icon = new System.Drawing.Icon(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "icon.ico")),
        };

        _trayIcon.DoubleClick += (_, _) =>
        {
            Show();
            WindowState = WindowState.Normal;
            Activate();
        };

        var menu = new ContextMenuStrip();
        menu.Items.Add("Открыть", null, (_, _) =>
        {
            Show();
            WindowState = WindowState.Normal;
            Activate();
        });
        menu.Items.Add("Выход", null, (_, _) =>
        {
            _trayIcon?.Dispose();
            Application.Current.Shutdown();
        });
        _trayIcon.ContextMenuStrip = menu;
    }

    private async void OnWindowLoaded(object sender, RoutedEventArgs e)
    {
        try
        {
            var env = await CoreWebView2Environment.CreateAsync();
            await WebView.EnsureCoreWebView2Async(env);

            WebView.CoreWebView2.NewWindowRequested += OnNewWindowRequested;
            WebView.CoreWebView2.ProcessFailed += OnProcessFailed;

            WebView.CoreWebView2.Navigate(AppUrl);
            WebView.Visibility = Visibility.Visible;
            LoadingOverlay.Visibility = Visibility.Collapsed;
        }
        catch (Exception ex)
        {
            System.Windows.MessageBox.Show(
                $"Ошибка инициализации WebView2.\n\n{ex.Message}",
                "Together",
                MessageBoxButton.OK,
                MessageBoxImage.Error);
            Close();
        }
    }

    private void OnTitleBarMouseDown(object sender, MouseButtonEventArgs e)
    {
        if (e.ClickCount == 2)
        {
            ToggleMaximize();
        }
        else
        {
            DragMove();
        }
    }

    private void BtnMinimize_Click(object sender, RoutedEventArgs e) =>
        WindowState = WindowState.Minimized;

    private void BtnMaximize_Click(object sender, RoutedEventArgs e) =>
        ToggleMaximize();

    private void BtnClose_Click(object sender, RoutedEventArgs e)
    {
        Hide();
    }

    private void ToggleMaximize() =>
        WindowState = WindowState == WindowState.Maximized
            ? WindowState.Normal
            : WindowState.Maximized;

    private void OnWindowStateChanged(object? sender, EventArgs e)
    {
        if (WindowState == WindowState.Minimized)
        {
            Hide();
        }
    }

    private void OnNewWindowRequested(object? sender, CoreWebView2NewWindowRequestedEventArgs e)
    {
        e.Handled = true;
        Process.Start(new ProcessStartInfo(e.Uri) { UseShellExecute = true });
    }

    private async void OnProcessFailed(object? sender, CoreWebView2ProcessFailedEventArgs e)
    {
        if (e.ProcessFailedKind == CoreWebView2ProcessFailedKind.BrowserProcessExited)
        {
            await Dispatcher.InvokeAsync(async () =>
            {
                var result = System.Windows.MessageBox.Show(
                    "Процесс браузера завершился. Перезапустить?",
                    "Together",
                    MessageBoxButton.YesNo,
                    MessageBoxImage.Warning);

                if (result == MessageBoxResult.Yes)
                {
                    WebView.Visibility = Visibility.Collapsed;
                    LoadingOverlay.Visibility = Visibility.Visible;
                    await WebView.EnsureCoreWebView2Async();
                    WebView.CoreWebView2.Navigate(AppUrl);
                    WebView.Visibility = Visibility.Visible;
                    LoadingOverlay.Visibility = Visibility.Collapsed;
                }
                else
                {
                    Close();
                }
            });
        }
    }

    private void OnWindowClosing(object? sender, System.ComponentModel.CancelEventArgs e)
    {
        _trayIcon?.Dispose();
        WebView?.Dispose();
    }
}