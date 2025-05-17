'use client';

import React from 'react';
import { Box, Button, Typography, List, ListItem, ListItemText, Paper, Grid, Divider } from '@mui/material';
import { AddCircleOutline, GroupAddOutlined } from '@mui/icons-material';

// Mock data for demonstration purposes
const individualReports = [
  { id: '1', title: 'گزارش فردی اول', date: '۱۴۰۳/۰۴/۰۱' },
  { id: '2', title: 'گزارش فردی دوم', date: '۱۴۰۳/۰۴/۰۵' },
];

const groupReports = [
  { id: '1', title: 'گزارش گروهی اول', date: '۱۴۰۳/۰۴/۰۲' },
  { id: '2', title: 'گزارش گروهی دوم', date: '۱۴۰۳/۰۴/۰۷' },
];

export default function ReportsPage() {
  const handleGenerateIndividualReport = () => {
    // Placeholder for individual report generation logic
    console.log('Generating individual report...');
  };

  const handleGenerateGroupReport = () => {
    // Placeholder for group report generation logic
    console.log('Generating group report...');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold', color: 'primary.main', mb: 4 }}>
        مدیریت گزارشات
      </Typography>

      <Grid container spacing={4}>
        {/* Individual Reports Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'secondary.main', textAlign: 'right', mb: 2 }}>
              گزارشات فردی
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddCircleOutline />}
              onClick={handleGenerateIndividualReport}
              sx={{ mb: 2, float: 'left' }}
            >
              ایجاد گزارش فردی جدید
            </Button>
            <List>
              {individualReports.map((report) => (
                <React.Fragment key={report.id}>
                  <ListItem
                    sx={{
                      mb: 1,
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <ListItemText
                      primaryTypographyProps={{ fontWeight: 'medium', textAlign: 'right' }}
                      secondaryTypographyProps={{ textAlign: 'right' }}
                      primary={report.title}
                      secondary={`تاریخ: ${report.date}`}
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
              {individualReports.length === 0 && (
                <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 2 }}>
                  هیچ گزارش فردی یافت نشد.
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Group Reports Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'secondary.main', textAlign: 'right', mb: 2 }}>
              گزارشات گروهی
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<GroupAddOutlined />}
              onClick={handleGenerateGroupReport}
              sx={{ mb: 2, float: 'left' }}
            >
              ایجاد گزارش گروهی جدید
            </Button>
            <List>
              {groupReports.map((report) => (
                <React.Fragment key={report.id}>
                  <ListItem
                    sx={{
                      mb: 1,
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <ListItemText
                      primaryTypographyProps={{ fontWeight: 'medium', textAlign: 'right' }}
                      secondaryTypographyProps={{ textAlign: 'right' }}
                      primary={report.title}
                      secondary={`تاریخ: ${report.date}`}
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
              {groupReports.length === 0 && (
                <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 2 }}>
                  هیچ گزارش گروهی یافت نشد.
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
